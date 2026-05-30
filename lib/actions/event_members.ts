'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type EventMemberRole = 'owner' | 'admin' | 'uploader' | 'viewer';

export interface EventMember {
  id: string;
  event_id: string;
  user_id: string;
  role: EventMemberRole;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export interface ProfileSearch {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

// Check if current user is owner or admin of the event
async function checkEventPermission(eventId: string, allowedRoles: EventMemberRole[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!data) return false;
  return allowedRoles.includes(data.role as EventMemberRole);
}

export async function getEventMembers(eventId: string): Promise<ServerActionResponse<EventMember[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_members')
      .select('*, profiles(full_name, avatar_url, email)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return { success: true, data: data as unknown as EventMember[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function searchUsers(query: string, eventId: string): Promise<ServerActionResponse<ProfileSearch[]>> {
  if (!query || query.length < 2) return { success: true, data: [] };
  
  try {
    const supabase = await createClient();
    
    // First, find users already in the event to exclude them
    const { data: existingMembers } = await supabase
      .from('event_members')
      .select('user_id')
      .eq('event_id', eventId);
      
    const existingIds = existingMembers?.map(m => m.user_id) || [];

    // Search profiles
    let queryBuilder = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
      
    if (existingIds.length > 0) {
      queryBuilder = queryBuilder.not('id', 'in', `(${existingIds.join(',')})`);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return { success: true, data: data as ProfileSearch[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addEventMember(eventId: string, userId: string, role: EventMemberRole): Promise<ServerActionResponse<void>> {
  try {
    const hasPermission = await checkEventPermission(eventId, ['owner', 'admin']);
    if (!hasPermission) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { error } = await supabase
      .from('event_members')
      .insert({ event_id: eventId, user_id: userId, role });

    if (error) throw error;
    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateEventMemberRole(eventId: string, userId: string, newRole: EventMemberRole): Promise<ServerActionResponse<void>> {
  try {
    const hasPermission = await checkEventPermission(eventId, ['owner', 'admin']);
    if (!hasPermission) throw new Error('Unauthorized');

    // Cannot downgrade an owner unless it's a transfer (handled separately)
    // Actually, cannot change an owner's role at all here.
    if (newRole === 'owner') throw new Error('Use transfer ownership to assign a new owner.');

    const supabase = await createClient();
    
    // Check if target user is currently an owner
    const { data: targetData } = await supabase.from('event_members').select('role').eq('event_id', eventId).eq('user_id', userId).single();
    if (targetData?.role === 'owner') throw new Error('Cannot change the role of the owner.');

    const { error } = await supabase
      .from('event_members')
      .update({ role: newRole })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeEventMember(eventId: string, userId: string): Promise<ServerActionResponse<void>> {
  try {
    const hasPermission = await checkEventPermission(eventId, ['owner', 'admin']);
    if (!hasPermission) throw new Error('Unauthorized');

    const supabase = await createClient();
    
    // Check if target user is currently an owner
    const { data: targetData } = await supabase.from('event_members').select('role').eq('event_id', eventId).eq('user_id', userId).single();
    if (targetData?.role === 'owner') throw new Error('Cannot remove the owner of the event.');

    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function transferOwnership(eventId: string, newOwnerId: string): Promise<ServerActionResponse<void>> {
  try {
    // Only current owner can transfer ownership
    const hasPermission = await checkEventPermission(eventId, ['owner']);
    if (!hasPermission) throw new Error('Unauthorized. Only the owner can transfer ownership.');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Make new owner an 'owner'
    const { error: err1 } = await supabase
      .from('event_members')
      .update({ role: 'owner' })
      .eq('event_id', eventId)
      .eq('user_id', newOwnerId);

    if (err1) throw err1;

    // Downgrade current owner to 'admin'
    const { error: err2 } = await supabase
      .from('event_members')
      .update({ role: 'admin' })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (err2) throw err2;

    revalidatePath(`/events/${eventId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
