'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  resource_type: string;
  duration?: number;
}

export async function syncMediaToDatabase(
  eventId: string,
  uploadResult: CloudinaryUploadResult,
  isPrivate: boolean = false
) {
  try {
    const supabase = await createClient();
    
    // Authenticate the uploader
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in to upload media.' };
    }

    // Authenticate the uploader's event permissions
    const { data: memberData } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin', 'uploader'])
      .single();

    if (!memberData) {
      return { success: false, error: 'Unauthorized. You do not have permission to upload to this event.' };
    }

    // Determine media type based on Cloudinary resource_type
    const mediaType = uploadResult.resource_type === 'video' ? 'video' : 'photo';
    
    // We can auto-generate a smart thumbnail URL via Cloudinary transformations
    // c_fill,g_auto ensures faces/subjects are centered if present
    const thumbnailUrl = uploadResult.resource_type === 'video' 
      ? uploadResult.secure_url.replace('.mp4', '.jpg') // Grab video poster
      : uploadResult.secure_url.replace('/upload/', '/upload/c_fill,g_auto,w_500,h_500,q_auto,f_auto/');

    // Insert into the expanded media table
    const { error: dbError } = await supabase
      .from('media')
      .insert({
        event_id: eventId,
        file_url: uploadResult.secure_url,
        thumbnail_url: thumbnailUrl,
        cloudinary_public_id: uploadResult.public_id,
        media_type: mediaType,
        uploaded_by: user.id,
        is_private: isPrivate,
        file_size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration || null,
        mime_type: `${uploadResult.resource_type}/${uploadResult.format}`,
        upload_status: 'completed',
        processing_status: 'idle', // ready for AI processing in the future
      });

    if (dbError) {
      console.error('Supabase Insertion Error:', dbError);
      return { success: false, error: 'Failed to sync media metadata to database.' };
    }

    revalidatePath('/events/[id]', 'page');
    revalidatePath('/upload');
    
    return { success: true };
  } catch (error) {
    console.error('Sync Exception:', error);
    return { success: false, error: 'An unexpected error occurred during database sync.' };
  }
}
