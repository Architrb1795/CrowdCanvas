'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFaceProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('face_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching face profile:', error);
    return null;
  }

  return data;
}

export async function createFaceProfile(embedding: number[], consentGiven: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!consentGiven) {
    return { success: false, error: 'Consent is required' };
  }

  if (embedding.length !== 128) {
    return { success: false, error: 'Invalid face embedding format' };
  }

  try {
    // 1. Convert number[] to string format for pgvector '[0.1, 0.2, ...]'
    const embeddingStr = `[${embedding.join(',')}]`;

    // 2. Insert or update the face profile
    const { error: insertError } = await supabase
      .from('face_profiles')
      .upsert({
        user_id: user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embedding: embeddingStr as any,
        consent_given: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (insertError) throw insertError;

    // 3. Immediately trigger a search against existing media_faces
    // We can do this in the background, but wait! We can just call the Supabase RPC if we create one, or do it via server logic.
    // For now, we will call an internal API or just let the background job handle it.
    // Actually, we can fetch matching faces directly:
    // Wait, let's trigger a background Next.js API route to handle the historical scan so we don't block the UI
    try {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/faces/scan-historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).catch(e => console.error('Failed to trigger historical scan:', e));
    } catch (e) {
      console.error('Failed to initiate fetch for historical scan:', e);
    }

    revalidatePath('/profile');
    revalidatePath('/my-photos');
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Create Face Profile Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create face profile' };
  }
}

export async function deleteFaceProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('face_profiles')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete Face Profile Error:', error);
    return { success: false, error: 'Failed to delete face profile' };
  }

  revalidatePath('/profile');
  revalidatePath('/my-photos');
  return { success: true };
}

export async function getFaceStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile
  const { data: profile } = await supabase
    .from('face_profiles')
    .select('id, created_at')
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  // Count matches
  const { count: photosFound } = await supabase
    .from('face_matches')
    .select('*', { count: 'exact', head: true })
    .eq('face_profile_id', profile.id);

  // Count unique events
  const { data: eventsMatchedData } = await supabase
    .from('face_matches')
    .select('media_id, media(event_id)')
    .eq('face_profile_id', profile.id);

  let eventsFound = 0;
  if (eventsMatchedData) {
    const uniqueEvents = new Set(
      eventsMatchedData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => m.media?.event_id)
        .filter(Boolean)
    );
    eventsFound = uniqueEvents.size;
  }

  return {
    createdAt: profile.created_at,
    photosFound: photosFound || 0,
    eventsFound
  };
}
