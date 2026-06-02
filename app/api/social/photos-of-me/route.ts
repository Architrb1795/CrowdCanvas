import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Fetch manual tags
    const { data: manualTags, error: tagError } = await supabase
      .from('photo_user_tags')
      .select('media_id, media(*, events(*))')
      .eq('tagged_user_id', userId)
      .eq('status', 'approved');

    if (tagError) throw tagError;

    // Fetch facial recognition matches
    // Need to get face_profile_id first
    const { data: faceProfile } = await supabase
      .from('face_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let faceMatches: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [];
    if (faceProfile) {
      const { data: matches, error: matchError } = await supabase
        .from('face_matches')
        .select('media_id, media(*, events(*))')
        .eq('face_profile_id', faceProfile.id)
        .eq('status', 'approved'); // or whatever status means matched and verified

      if (!matchError && matches) {
        faceMatches = matches;
      }
    }

    // Combine and deduplicate media
    const allMediaMap = new Map();
    
    manualTags?.forEach(tag => {
      if (tag.media && !allMediaMap.has(tag.media_id)) {
        allMediaMap.set(tag.media_id, tag.media);
      }
    });

    faceMatches?.forEach(match => {
      if (match.media && !allMediaMap.has(match.media_id)) {
        allMediaMap.set(match.media_id, match.media);
      }
    });

    const combinedMedia = Array.from(allMediaMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ media: combinedMedia });

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Error in photos-of-me GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
