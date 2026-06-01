import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';

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
- "caption": A highly detailed natural language caption describing the scene.
- "tags": Array of 10-20 descriptive tags.
- "objects": Array of specific physical objects visible.
- "ocrText": Any text visible in the image (posters, banners, signs). Empty string if none.
- "sceneType": The type of scene (e.g. dance floor, stage performance, group photo, etc).
- "mood": The overall mood or vibe (e.g. celebratory, professional, energetic).
- "peopleCount": Integer estimate of people in the photo.
- "dominantColors": Array of 2-4 dominant colors.

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
    const embedText = `Caption: ${analysis.caption}. Tags: ${analysis.tags.join(', ')}. Scene: ${analysis.sceneType}. OCR: ${analysis.ocrText}.`;
    
    const embedResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: embedText,
        config: { outputDimensionality: 384 }
    });

    const embedding = embedResponse.embeddings?.[0]?.values;
    if (!embedding) throw new Error('Failed to generate embedding');

    // 4. Update the Database
    const { error: dbError } = await supabaseAdmin.from('media').update({
        ai_caption: analysis.caption,
        ai_tags: analysis.tags,
        ai_objects: analysis.objects,
        ocr_text: analysis.ocrText,
        scene_type: analysis.sceneType,
        mood: analysis.mood,
        people_count: analysis.peopleCount,
        dominant_colors: analysis.dominantColors,
        embedding: JSON.stringify(embedding),
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
        processing_status: 'completed'
    }).eq('id', mediaId);

    if (dbError) throw dbError;

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
