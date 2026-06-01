/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { mediaId } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    // 1. Fetch the embedding for the given media ID
    const { data: mediaData, error: fetchError } = await supabaseAdmin
      .from('media')
      .select('embedding')
      .eq('id', mediaId)
      .single();

    if (fetchError || !mediaData?.embedding) {
      return NextResponse.json({ error: 'Media not found or missing embedding.' }, { status: 404 });
    }

    // 2. Perform Vector Search to find similar media
    const { data: matchedMedia, error: matchError } = await supabaseAdmin.rpc('match_media', {
      query_embedding: mediaData.embedding,
      match_threshold: 0.6, // Must be somewhat similar
      match_count: 9, // Will return itself as #1, so we take 9 to show 8 similar
    });

    if (matchError) throw matchError;

    // Filter out the original media from results
    const results = (matchedMedia || []).filter((m: any) => m.id !== mediaId).slice(0, 8);

    return NextResponse.json({ success: true, results });

  } catch (error: unknown) {
    console.error('Similar Search Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
