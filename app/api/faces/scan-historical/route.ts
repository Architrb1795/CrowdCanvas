import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('face_profiles')
      .select('id, embedding')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Face profile not found' }, { status: 404 });
    }

    // 2. Find all matching media_faces
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches, error: matchError } = await (supabase as any).rpc('match_faces', {
        query_embedding: profile.embedding,
        match_threshold: 0.70,
        match_count: 10000 // A large number to get all historical matches
      });

    if (matchError) throw matchError;

    // 3. Insert matches into face_matches
    if (matches && matches.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const faceMatchesData = matches.map((match: any) => ({
        face_profile_id: profile.id,
        media_face_id: match.media_face_id,
        media_id: match.media_id,
        similarity_score: match.similarity,
        status: match.similarity >= 0.95 ? 'high' : match.similarity >= 0.85 ? 'medium' : 'low'
      }));

      // Use upsert to avoid duplicates if rerun
      const { error: insertError } = await supabase
        .from('face_matches')
        .upsert(faceMatchesData, { onConflict: 'face_profile_id, media_face_id' });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, matchesFound: matches?.length || 0 });
  } catch (error: unknown) {
    console.error('Scan historical error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
