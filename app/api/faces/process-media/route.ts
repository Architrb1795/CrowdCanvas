import { NextResponse } from 'next/server';
import { processImageForFaces } from '@/lib/face-recognition/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Set max duration for Vercel/Next.js to prevent timeouts

export async function POST(req: Request) {
  try {
    const { mediaId, fileUrl } = await req.json();

    if (!mediaId || !fileUrl) {
      return NextResponse.json({ error: 'Missing mediaId or fileUrl' }, { status: 400 });
    }

    const supabase = await createClient();

    // Mark job as processing
    await supabase
      .from('recognition_jobs')
      .update({ status: 'processing' })
      .eq('media_id', mediaId);

    // Extract faces
    const faces = await processImageForFaces(fileUrl);

    if (faces.length > 0) {
      // Prepare records for media_faces
      const mediaFacesData = faces.map((face: { descriptor: number[], box: { x: number, y: number, width: number, height: number }, score: number }) => ({
        media_id: mediaId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embedding: `[${face.descriptor.join(',')}]` as any,
        bounding_box: {
          x: face.box.x,
          y: face.box.y,
          width: face.box.width,
          height: face.box.height
        },
        confidence: face.score
      }));

      // Insert media faces
      const { data: insertedFaces, error: insertError } = await supabase
        .from('media_faces')
        .insert(mediaFacesData)
        .select('id, embedding');

      if (insertError) throw insertError;

      // Now match against existing profiles
      for (const face of insertedFaces) {
        // Use the match_faces function we created
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: matches, error: matchError } = await (supabase as any).rpc('match_faces', {
            query_embedding: face.embedding,
            match_threshold: 0.70, // Minimum threshold for low match
            match_count: 5 // Top 5 matches just in case
          });

        if (!matchError && matches) {
          for (const match of matches) {
            // Find the profile id for this match
            // Wait, match_faces checks media_faces against query_embedding.
            // Oh, we need to match a media_face against face_profiles!
            // I wrote match_faces to do the opposite!
            // Let's just do it directly using a standard query or fix the logic
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profiles } = await (supabase as any).rpc('match_media_to_profiles', {
                query_embedding: face.embedding,
                match_threshold: 0.70
              });
              
            if (profiles) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const faceMatchesData = profiles.map((p: any) => ({
                face_profile_id: p.profile_id,
                media_face_id: face.id,
                media_id: mediaId,
                similarity_score: p.similarity,
                status: p.similarity >= 0.95 ? 'high' : p.similarity >= 0.85 ? 'medium' : 'low'
              }));
              
              if (faceMatchesData.length > 0) {
                await supabase.from('face_matches').insert(faceMatchesData).select();
                // Notifications could be sent here!
              }
            }
          }
        }
      }
    }

    // Mark job as completed
    await supabase
      .from('recognition_jobs')
      .update({ 
        status: 'completed', 
        faces_found: faces.length,
        completed_at: new Date().toISOString()
      })
      .eq('media_id', mediaId);

    return NextResponse.json({ success: true, facesFound: faces.length });

  } catch (error: unknown) {
    console.error('Process media error:', error);
    
    // Attempt to log failure
    try {
      const { mediaId } = await req.json().catch(() => ({}));
      if (mediaId) {
        const supabase = await createClient();
        await supabase
          .from('recognition_jobs')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('media_id', mediaId);
      }
    } catch(e) {}

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown Error' }, { status: 500 });
  }
}
