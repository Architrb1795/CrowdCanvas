/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  stats: {
    eventsJoined: number;
    eventsManaged: number;
    mediaUploaded: number;
  };
}

export interface UserUploadData {
  id: string;
  event_id: string;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  created_at: string;
  events: { name: string } | null;
}

export interface UserEventData {
  event_id: string;
  role: string;
  events: {
    id: string;
    name: string;
    event_date: string | null;
    is_public: boolean;
  } | null;
}

export async function getProfile(): Promise<ServerActionResponse<UserProfileData>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Fetch stats
    const [{ count: eventsJoined }, { count: eventsManaged }, { count: mediaUploaded }] = await Promise.all([
      supabase.from('event_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('event_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('role', ['owner', 'admin']),
      supabase.from('media').select('*', { count: 'exact', head: true }).eq('uploaded_by', user.id)
    ]);

    return {
      success: true,
      data: {
        ...profile,
        stats: {
          eventsJoined: eventsJoined || 0,
          eventsManaged: eventsManaged || 0,
          mediaUploaded: mediaUploaded || 0
        }
      } as UserProfileData
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProfile(data: { full_name?: string; bio?: string }): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;
    
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAvatar(url: string): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (error) throw error;
    
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getUserUploads(): Promise<ServerActionResponse<UserUploadData[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('media')
      .select('id, event_id, file_url, thumbnail_url, media_type, created_at, events(name)')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { success: true, data: data as unknown as UserUploadData[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUserUpload(mediaId: string): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    // Only allow deletion if the user actually uploaded it
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)
      .eq('uploaded_by', user.id);

    if (error) throw error;
    
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getUserEvents(): Promise<ServerActionResponse<UserEventData[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('event_members')
      .select('event_id, role, events(id, name, event_date, is_public)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { success: true, data: data as unknown as UserEventData[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
