import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { sendEventSummaryEmail } from '@/lib/actions/email';
import { logger } from '@/lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING' });

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    // 1. Fetch Event and all its processed media
    const { data: event, error: eventError } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (eventError || !event) throw new Error('Event not found');

    const { data: media, error: mediaError } = await supabaseAdmin
      .from('media')
      .select('id, file_url, ai_caption, ai_tags, scene_type, mood, people_count, created_at')
      .eq('event_id', eventId)
      .eq('ai_processed', true)
      .order('created_at', { ascending: true });

    if (mediaError) throw mediaError;

    if (!media || media.length === 0) {
      return NextResponse.json({ error: 'No AI-processed media available to generate insights.' }, { status: 400 });
    }

    // 2. Prepare context for Gemini
    const mediaContext = media.map(m => ({
      id: m.id,
      caption: m.ai_caption,
      tags: m.ai_tags,
      scene: m.scene_type,
      time: m.created_at,
    }));

    const prompt = `Analyze this event data and media metadata to generate intelligent insights.
Event Name: ${event.name}
Event Description: ${event.description || 'N/A'}

Media items:
${JSON.stringify(mediaContext, null, 2)}

Generate a strict JSON response containing:
1. "summary": A cohesive 2-3 sentence paragraph summarizing the event based on the media contents.
2. "highlights": An array of exactly up to 10 media IDs that represent the "Best Moments" (prioritize variety and quality).
3. "timeline": An array of objects with "timeLabel" (e.g., "Opening", "Midway", "Conclusion"), "description", and "mediaId" (choose the best representative image ID).

Respond ONLY with JSON without markdown wrappers.`;

    const chatResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = chatResponse.text;
    if (!text) throw new Error('No response from Gemini');

    const analysis = JSON.parse(text);

    // 3. Update Database
    const { error: updateError } = await supabaseAdmin.from('events').update({
      ai_summary: analysis.summary,
      ai_highlights: analysis.highlights,
      event_story: analysis.timeline,
      event_tags: [], // Could be extracted if needed
    }).eq('id', eventId);

    if (updateError) throw updateError;

    // Send Email Notification to Event Owner
    if (event.created_by) {
      const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(event.created_by);
      if (userAuth?.user?.email) {
        await sendEventSummaryEmail(userAuth.user.email, event.name, event.id);
      }
    }

    return NextResponse.json({ success: true, analysis });

  } catch (error: unknown) {
    logger.error('Event Insights Error', error, { eventId: req.url });
    
    // Handle Gemini Rate Limits gracefully
    const err = error as Record<string, unknown> | null;
    if (err?.status === 429 || (err?.message as string)?.includes('429') || (err?.message as string)?.includes('quota')) {
      return NextResponse.json({ error: 'AI Rate Limit Exceeded. Please wait 30 seconds and try again.' }, { status: 429 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
