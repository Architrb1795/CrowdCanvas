import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/services/NotificationService';

// Initialize Supabase Admin Client to bypass RLS for background updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING' });

export async function POST(req: Request) {
  let mediaIdToUpdate: string | null = null;
  try {
    const body = await req.json();
    const { mediaId, fileUrl } = body;
    mediaIdToUpdate = mediaId;

    if (!mediaId || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      await supabaseAdmin.from('media').update({
        processing_status: 'failed',
        processing_error: 'Missing GEMINI_API_KEY'
      }).eq('id', mediaId);
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    await supabaseAdmin.from('media').update({ processing_status: 'processing' }).eq('id', mediaId);

    // 1. Fetch the image to get base64
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to fetch media file for AI processing');
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    // 2. Call Gemini 2.5 Flash Vision
    const prompt = `Analyze this image in detail. Extract and generate the following information formatted strictly as a JSON object:
- "title": A short catchy title for this media (2-5 words).
- "caption": A highly concise, single-sentence summary of the media (maximum 15-20 words). Do not exceed 20 words.
- "tags": Array of 10-20 descriptive tags.
- "objects": Array of specific physical objects visible.
- "ocrText": Any text visible in the image (posters, banners, signs). Empty string if none.
- "sceneType": The type of scene (e.g. dance floor, stage performance, group photo, etc).
- "mood": The overall mood or vibe (e.g. celebratory, professional, energetic).
- "style": The visual style or aesthetic (e.g. futuristic, cinematic, vintage, minimalist).
- "peopleCount": Integer estimate of people in the photo.
- "dominantColors": Array of 2-4 dominant colors.
- "confidence": Integer from 0 to 100 representing your confidence in this analysis.

Respond ONLY with the JSON object, without any markdown formatting.`;

    const chatResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ],
        config: {
            responseMimeType: 'application/json',
        }
    });

    const text = chatResponse.text;
    if (!text) throw new Error('No text returned from Gemini');

    const analysis = JSON.parse(text);

    // 3. Generate Embeddings for Semantic Search
    const embedText = `Title: ${analysis.title}. Caption: ${analysis.caption}. Tags: ${analysis.tags.join(', ')}. Scene: ${analysis.sceneType}. OCR: ${analysis.ocrText}. Style: ${analysis.style}.`;
    
    const embedResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: embedText,
        config: { outputDimensionality: 384 }
    });

    const embedding = embedResponse.embeddings?.[0]?.values;
    if (!embedding) throw new Error('Failed to generate embedding');

    // 4. Update the Database
    const { error: dbError } = await supabaseAdmin.from('media').update({
        title: analysis.title,
        ai_caption: analysis.caption,
        ai_tags: analysis.tags,
        ai_objects: analysis.objects,
        ocr_text: analysis.ocrText,
        scene_type: analysis.sceneType,
        mood: analysis.mood,
        ai_style: analysis.style,
        people_count: analysis.peopleCount,
        dominant_colors: analysis.dominantColors,
        ai_confidence: analysis.confidence,
        embedding: JSON.stringify(embedding),
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
        processing_status: 'completed'
    }).eq('id', mediaId);

    if (dbError) throw dbError;

    // Fetch owner to notify
    const { data } = await supabaseAdmin.from('media').select('uploaded_by').eq('id', mediaId).single();
    const mediaOwner = data as unknown as { uploaded_by: string } | null;
    if (mediaOwner && mediaOwner.uploaded_by) {
        await NotificationService.notifyAIAnalysis(mediaOwner.uploaded_by, analysis.title, mediaId);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    logger.error('AI Processing Error', error, { mediaId: mediaIdToUpdate });
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    
    if (mediaIdToUpdate) {
      await supabaseAdmin.from('media').update({
        processing_status: 'failed',
        processing_error: errorMessage
      }).eq('id', mediaIdToUpdate);
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
