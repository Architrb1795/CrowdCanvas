import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { normalizeQuery } from '@/lib/search/normalization';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, filterEventId, filterMood, filterScene, filterPeopleCount, debug } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Normalize Query
    const normalized = normalizeQuery(query);
    const allSearchTerms = normalized.allTerms;
    
    let embedding: number[] | null = null;
    let fallbackMode = false;

    // 2. Generate Embedding (with Graceful Fallback)
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error('Missing Gemini Key');
      const embedResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: query, // Embed original query for nuance
        config: { outputDimensionality: 384 } // OR 768 depending on previous migration fix
      });
      embedding = embedResponse.embeddings?.[0]?.values || null;
      if (!embedding) throw new Error('Null embedding returned');
    } catch (e) {
      console.warn('Embedding generation failed, falling back to text-only search:', e);
      fallbackMode = true;
    }

    let candidates: Record<string, unknown>[] = [];

    // 3. Fetch Candidates
    if (!fallbackMode && embedding) {
      // Vector Search
      const { data: matchedMedia, error } = await supabaseAdmin.rpc('match_media', {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.1, 
        match_count: 100, // Large pool for JS ranking
        filter_event_id: filterEventId || null,
        filter_mood: filterMood || null,
        filter_scene: filterScene || null,
        filter_people_count: filterPeopleCount || null,
      });
      if (error) throw error;
      candidates = matchedMedia || [];
      
      // Fetch missing columns (ocr, mood, scene_type) since match_media doesn't return them
      if (candidates.length > 0) {
        const ids = candidates.map(c => c.id);
        const { data: extraData } = await supabaseAdmin.from('media').select('id, ocr_text, mood, scene_type').in('id', ids);
        if (extraData) {
           const extraMap = new Map(extraData.map(e => [e.id, e]));
           candidates = candidates.map(c => ({ ...c, ...extraMap.get(c.id) }));
        }
      }
    } else {
      // Text-Only Fallback Search
      let queryBuilder = supabaseAdmin.from('media').select('id, event_id, file_url, thumbnail_url, media_type, ai_caption, ai_tags, ocr_text, mood, scene_type');
      if (filterEventId) queryBuilder = queryBuilder.eq('event_id', filterEventId);
      if (filterMood) queryBuilder = queryBuilder.eq('mood', filterMood);
      if (filterScene) queryBuilder = queryBuilder.eq('scene_type', filterScene);
      if (filterPeopleCount) queryBuilder = queryBuilder.eq('people_count', filterPeopleCount);
      
      const orConditions = allSearchTerms.map(term => `ai_caption.ilike.%${term}%`).join(',');
      queryBuilder = queryBuilder.or(orConditions).limit(100);
      
      const { data: textMatches, error } = await queryBuilder;
      if (error) throw error;
      candidates = (textMatches || []).map(m => ({ ...m, similarity: 0 })); // base embedding score 0
    }

    if (candidates.length === 0) {
       return NextResponse.json({ success: true, results: [] });
    }

    // 4. Multi-Signal Scoring Engine V2
    const W_TAG = 0.35;
    const W_CAPTION = 0.25;
    const W_OCR = 0.20;
    const W_META = 0.10;
    const W_EMB = 0.10;

    const rankedResults = candidates.map(media => {
       const captionStr = ((media.ai_caption as string) || '').toLowerCase();
       const ocrStr = ((media.ocr_text as string) || '').toLowerCase();
       const moodStr = ((media.mood as string) || '').toLowerCase();
       const sceneStr = ((media.scene_type as string) || '').toLowerCase();
       const tagsArr = ((media.ai_tags as string[]) || []).map((t: string) => t.toLowerCase());

       let tagScore = 0;
       let captionScore = 0;
       let ocrScore = 0;
       let metaScore = 0;
       const embScore = Math.max(0, (media.similarity as number) || 0); // clamp negative
       
       for (const term of allSearchTerms) {
          // Tag Score: Exact match = 1.0, Substring match = 0.5
          if (tagsArr.includes(term)) tagScore = Math.max(tagScore, 1.0);
          else if (tagsArr.some((t: string) => t.includes(term))) tagScore = Math.max(tagScore, 0.5);

          // Caption Score
          if (captionStr.includes(term)) captionScore = 1.0;

          // OCR Score
          if (ocrStr.includes(term)) ocrScore = 1.0;

          // Meta Score
          if (moodStr.includes(term) || sceneStr.includes(term)) metaScore = 1.0;
       }

       // Intelligent Fallbacks: Re-weight if missing signals
       let denominator = W_EMB + W_TAG + W_CAPTION; // Base expected
       let totalScore = (embScore * W_EMB) + (tagScore * W_TAG) + (captionScore * W_CAPTION);

       if (media.ocr_text) {
          denominator += W_OCR;
          totalScore += (ocrScore * W_OCR);
       }
       if (media.mood || media.scene_type) {
          denominator += W_META;
          totalScore += (metaScore * W_META);
       }

       // Exact Match Boosting! 
       // If TagScore is 1.0 and CaptionScore is 1.0, this is a highly confident match.
       let finalScore = totalScore / denominator;
       if (tagScore === 1.0) finalScore += 0.15; // Mega Boost
       if (captionScore === 1.0 && ocrScore === 1.0) finalScore += 0.10;

       finalScore = Math.min(finalScore, 1.0); // Cap at 1.0

       const result: Record<string, unknown> = {
         id: media.id,
         event_id: media.event_id,
         file_url: media.file_url,
         thumbnail_url: media.thumbnail_url,
         media_type: media.media_type,
         ai_caption: media.ai_caption,
         ai_tags: media.ai_tags,
         similarity: finalScore, // Override similarity with Composite final score
       };

       if (debug) {
         result._debugScores = {
            normalizedQuery: allSearchTerms,
            rawEmbeddingScore: embScore,
            tagScore,
            captionScore,
            ocrScore,
            metadataScore: metaScore,
            fallbackMode,
            finalScore
         };
       }

       return result;
    });

    // 5. Sort & Return top 20
    rankedResults.sort((a, b) => (b.similarity as number) - (a.similarity as number));
    const topResults = rankedResults.slice(0, 20);

    return NextResponse.json({ success: true, results: topResults });

  } catch (error: unknown) {
    console.error('AI Search Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
