'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { processImageForFaces } from '../face-recognition/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const getAdminDb = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function extractFaceServerSide(base64Image: string) {
  try {
    const detections = await processImageForFaces(base64Image);
    if (!detections || detections.length === 0) {
      return { success: false, error: 'No face detected. Please ensure your face is clearly visible.' };
    }
    // Return the largest face's embedding
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const face = detections.reduce((prev: any, current: any) => {
      return (prev.box.width * prev.box.height > current.box.width * current.box.height) ? prev : current;
    });
    return { success: true, embedding: face.descriptor };
  } catch (error: unknown) {
    console.error('Server face extraction error:', error);
    return { success: false, error: 'Failed to process image on server.' };
  }
}

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

    // Use adminDb to bypass RLS unique constraints or missing UPDATE policies
    const adminDb = getAdminDb();

    // 2. Insert or update the face profile
    const { error: insertError, data: profile } = await adminDb
      .from('face_profiles')
      .upsert({
        user_id: user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embedding: embeddingStr as any,
        consent_given: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // 2.5 Delete old face matches to ensure a clean slate
    if (profile) {
      await adminDb.from('face_matches').delete().eq('face_profile_id', profile.id);
    }

    // 3. Directly scan historical faces without relying on an external fetch which often times out
    await scanHistoricalFaces(user.id);

    revalidatePath('/profile');
    revalidatePath('/my-photos');
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Create Face Profile Error:', error);
    return { success: false, error: typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error) };
  }
}

export async function scanHistoricalFaces(userId?: string) {
  try {
    const supabase = await createClient();
    
    // If no userId provided, get from auth
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };
      targetUserId = user.id;
    }

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('face_profiles')
      .select('id, embedding')
      .eq('user_id', targetUserId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Face profile not found' };
    }

    // 2. Find all matching media_faces
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches, error: matchError } = await (supabase as any).rpc('match_faces', {
        query_embedding: profile.embedding,
        match_threshold: 0.65, // Increased to 0.65 for wider matching
        match_count: 10000 
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

      // Use adminDb because users don't have RLS INSERT permission on face_matches
      const adminDb = getAdminDb();
      const { error: insertError } = await adminDb
        .from('face_matches')
        .upsert(faceMatchesData, { onConflict: 'face_profile_id, media_face_id' });

      if (insertError) throw insertError;
    }

    revalidatePath('/profile');
    revalidatePath('/my-photos');
    return { success: true, matchesFound: matches?.length || 0 };
  } catch (error: unknown) {
    console.error('Scan historical error:', error);
    return { success: false, error: typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error) };
  }
}

export async function deleteFaceProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Use adminDb to bypass RLS missing DELETE policies
  const adminDb = getAdminDb();
  const { error } = await adminDb
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

  // Count unique photos instead of raw face matches
  const { data: matchesData } = await supabase
    .from('face_matches')
    .select('media_id, media(event_id)')
    .eq('face_profile_id', profile.id);

  let photosFound = 0;
  let eventsFound = 0;

  if (matchesData) {
    // Deduplicate by media_id to get actual photo count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniquePhotos = new Set(matchesData.map((m: any) => m.media_id));
    photosFound = uniquePhotos.size;

    const uniqueEvents = new Set(
      matchesData
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
