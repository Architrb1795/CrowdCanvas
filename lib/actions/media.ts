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
    const { data: insertedMedia, error: dbError } = await supabase
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
        processing_status: 'pending', // ready for AI processing
      })
      .select('id')
      .single();

    if (dbError || !insertedMedia) {
      console.error('Supabase Insertion Error:', dbError);
      return { success: false, error: 'Failed to sync media metadata to database.' };
    }

    revalidatePath('/events/[id]', 'page');
    revalidatePath('/upload');
    
    return { success: true, mediaId: insertedMedia.id };
  } catch (error) {
    console.error('Sync Exception:', error);
    return { success: false, error: 'An unexpected error occurred during database sync.' };
  }
}

import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary only once if env vars exist
if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function deleteMedia(mediaId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // Get media details
    const { data: media } = await supabase.from('media').select('*').eq('id', mediaId).single();
    if (!media) return { success: false, error: 'Media not found.' };

    // Check permissions
    let canDelete = false;
    if (media.uploaded_by === user.id) {
      canDelete = true;
    } else {
      const { data: member } = await supabase.from('event_members').select('role').eq('event_id', eventId).eq('user_id', user.id).single();
      if (member && ['owner', 'admin'].includes(member.role)) canDelete = true;
    }

    if (!canDelete) return { success: false, error: 'You do not have permission to delete this media.' };

    // Delete from Cloudinary if possible
    if (media.cloudinary_public_id && process.env.CLOUDINARY_API_SECRET) {
      try {
        await cloudinary.uploader.destroy(media.cloudinary_public_id);
      } catch (err) {
        console.error('Cloudinary destroy failed:', err);
      }
    }

    // Delete from Supabase
    const { error } = await supabase.from('media').delete().eq('id', mediaId);
    if (error) return { success: false, error: 'Failed to delete from database.' };

    revalidatePath('/media');
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error occurred.' };
  }
}

export async function toggleMediaVisibility(mediaId: string, eventId: string, isPrivate: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // Check permissions
    const { data: member } = await supabase.from('event_members').select('role').eq('event_id', eventId).eq('user_id', user.id).single();
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return { success: false, error: 'Only admins can change visibility.' };
    }

    const { error } = await supabase.from('media').update({ is_private: isPrivate }).eq('id', mediaId);
    if (error) return { success: false, error: 'Database error.' };

    revalidatePath('/media');
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error occurred.' };
  }
}

export async function saveMediaCopy(originalMediaId: string, eventId: string, newUrl: string, newThumbnailUrl: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // Check permissions
    const { data: member } = await supabase.from('event_members').select('role').eq('event_id', eventId).eq('user_id', user.id).single();
    if (!member || !['owner', 'admin', 'uploader'].includes(member.role)) {
      return { success: false, error: 'No permission to save.' };
    }

    // Get original to copy metadata
    const { data: original } = await supabase.from('media').select('*').eq('id', originalMediaId).single();
    if (!original) return { success: false, error: 'Original media not found.' };

    // Insert new row
    const { error } = await supabase.from('media').insert({
      event_id: eventId,
      file_url: newUrl,
      thumbnail_url: newThumbnailUrl,
      cloudinary_public_id: original.cloudinary_public_id, // Same public ID, just new URL params
      media_type: original.media_type,
      uploaded_by: user.id, // Current user is the one who created the edit
      is_private: original.is_private,
      file_size: original.file_size,
      width: original.width,
      height: original.height,
      mime_type: original.mime_type,
      upload_status: 'completed',
    });

    if (error) return { success: false, error: 'Database error saving copy.' };

    revalidatePath('/media');
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error occurred.' };
  }
}
