/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EventWithProfile {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  category: string | null;
  location: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    role: 'admin' | 'photographer' | 'member' | 'viewer';
  } | null;
  mediaCount?: number;
  memberCount?: number;
  currentUserRole?: 'owner' | 'admin' | 'uploader' | 'viewer' | null;
}

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches all events from Supabase, ordered by created_at DESC.
 * Bypasses strict relational join type limits using safe unknown typecasting.
 */
export async function getEvents(): Promise<ServerActionResponse<EventWithProfile[]>> {
  try {
    const supabase = await createClient();
    
    // Get current user to determine role
    const { data: { user } } = await supabase.auth.getUser();

    // Also fetch the media and member counts
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(full_name, role), media(count), event_members(user_id, role)')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }

    // Map over the data to properly extract counts and current user role
    const formattedEvents = (data as any[]).map((evt) => {
      const mCount = evt.media && evt.media.length > 0 ? evt.media[0].count : 0;
      
      const allMembers = evt.event_members || [];
      const memCount = allMembers.length;
      
      let currentUserRole = null;
      if (user) {
        const userMember = allMembers.find((m: any) => m.user_id === user.id);
        if (userMember) {
          currentUserRole = userMember.role;
        }
      }

      return {
        ...evt,
        mediaCount: mCount,
        memberCount: memCount,
        currentUserRole,
        event_members: undefined // clean up payload
      } as EventWithProfile;
    });

    return {
      success: true,
      data: formattedEvents || [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch events';
    return {
      success: false,
      error: message,
      data: [],
    };
  }
}

/**
 * Creates a new event inside the Supabase database.
 * Auto-resolves current session and performs route revalidation.
 */
export async function createEvent(
  prevState: unknown,
  formData: FormData
): Promise<ServerActionResponse<EventWithProfile>> {
  try {
    const supabase = await createClient();
    
    // Check current authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in to create events.' };
    }

    // Destructure and validate input
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const event_date = formData.get('event_date') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const cover_url = formData.get('cover_url') as string;
    const is_public = formData.get('is_public') === 'true';
    const initial_members_json = formData.get('initial_members') as string;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Event name is required.' };
    }

    if (!event_date) {
      return { success: false, error: 'Event date is required.' };
    }

    // Insert new event
    const { data: newEvent, error: insertError } = await (supabase.from('events') as any).insert({
      name: name.trim(),
      description: description ? description.trim() : null,
      event_date,
      category: category ? category : null,
      location: location ? location.trim() : null,
      cover_url: cover_url ? cover_url.trim() : null,
      is_public,
      created_by: user.id,
    }).select().single() as unknown as { data: EventWithProfile | null; error: { message: string } | null };

    if (insertError || !newEvent) {
      return {
        success: false,
        error: insertError?.message || 'Failed to record new event.',
      };
    }

    // EXPLICIT APPLICATION LEVEL OWNERSHIP INSERT
    // Do not rely solely on postgres triggers. This ensures ownership assignment is deterministic.
    const { error: memberError } = await supabase.from('event_members').insert({
      event_id: newEvent.id,
      user_id: user.id,
      role: 'owner'
    });

    if (memberError) {
      // Even if trigger fired, we want to be absolutely sure. 
      // If it fails due to unique constraint, that means trigger worked, which is fine.
      if (!memberError.message.includes('duplicate key value')) {
        console.error('Failed to insert owner explicitly:', memberError);
      }
    }

    if (!is_public && initial_members_json) {
      try {
        const memberIds = JSON.parse(initial_members_json) as string[];
        if (memberIds.length > 0) {
          const membersToInsert = memberIds.map(id => ({
            event_id: newEvent.id,
            user_id: id,
            role: 'viewer'
          }));
          const { error: inviteError } = await supabase.from('event_members').insert(membersToInsert);
          if (inviteError) console.error('Failed to insert initial members:', inviteError);
        }
      } catch (e) {
        console.error('Failed to parse or insert initial members:', e);
      }
    }

    // Revalidate paths to sync data across all users instantly
    revalidatePath('/events');

    return {
      success: true,
      data: newEvent,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An error occurred during event creation.';
    return {
      success: false,
      error: message,
    };
  }
}

export async function updateEventDetails(
  eventId: string,
  formData: FormData
): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    // Check current authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in to manage events.' };
    }

    // Check permissions - must be owner or admin
    const { data: memberData } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
      return { success: false, error: 'Unauthorized. Only event owners and admins can update event details.' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const event_date = formData.get('event_date') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const cover_url = formData.get('cover_url') as string;
    const is_public = formData.get('is_public') === 'true';

    // Watermark settings
    const watermark_enabled_raw = formData.get('watermark_enabled');
    let watermark_enabled: boolean | undefined = undefined;
    if (watermark_enabled_raw !== null) {
      watermark_enabled = watermark_enabled_raw === 'true';
    }
    const watermark_text = formData.get('watermark_text') as string;
    const watermark_style = formData.get('watermark_style') as string;
    const watermark_opacity = formData.get('watermark_opacity') ? parseInt(formData.get('watermark_opacity') as string, 10) : undefined;
    const watermark_size = formData.get('watermark_size') ? parseInt(formData.get('watermark_size') as string, 10) : undefined;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Event name is required.' };
    }
    if (!event_date) {
      return { success: false, error: 'Event date is required.' };
    }

     
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        name: name.trim(),
        description: description ? description.trim() : null,
        event_date,
        category: category ? category : null,
        location: location ? location.trim() : null,
        cover_url: cover_url ? cover_url.trim() : null,
        is_public,
        ...(watermark_enabled !== undefined && { watermark_enabled }),
        ...(watermark_text !== undefined && { watermark_text: watermark_text.trim() }),
        ...(watermark_style !== undefined && { watermark_style }),
        ...(watermark_opacity !== undefined && { watermark_opacity }),
        ...(watermark_size !== undefined && { watermark_size }),
      })
      .eq('id', eventId);

    if (updateError) throw updateError;

    revalidatePath(`/events/${eventId}/settings`);
    revalidatePath('/events');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An error occurred during event update.';
    return { success: false, error: message };
  }
}

export async function updateEventWatermark(eventId: string, formData: FormData): Promise<ServerActionResponse<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    // Check permissions - must be owner or admin
    const { data: memberData } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
      return { success: false, error: 'Unauthorized. Only event owners and admins can update event details.' };
    }

    const watermark_enabled_raw = formData.get('watermark_enabled');
    let watermark_enabled: boolean | undefined = undefined;
    if (watermark_enabled_raw !== null) {
      watermark_enabled = watermark_enabled_raw === 'true';
    }
    const watermark_text = formData.get('watermark_text') as string;
    const watermark_style = formData.get('watermark_style') as string;
    const watermark_opacity = formData.get('watermark_opacity') ? parseInt(formData.get('watermark_opacity') as string, 10) : undefined;
    const watermark_size = formData.get('watermark_size') ? parseInt(formData.get('watermark_size') as string, 10) : undefined;

     
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({
        ...(watermark_enabled !== undefined && { watermark_enabled }),
        ...(watermark_text !== undefined && { watermark_text: watermark_text.trim() }),
        ...(watermark_style !== undefined && { watermark_style }),
        ...(watermark_opacity !== undefined && { watermark_opacity }),
        ...(watermark_size !== undefined && { watermark_size }),
      })
      .eq('id', eventId)
      .select('id')
      .single();

    if (updateError) throw updateError;

    revalidatePath(`/events/${eventId}/settings`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');

    return { success: true };
  } catch (err: any) {
    console.error('Update Watermark Error:', err);
    const message = err?.message || (typeof err === 'string' ? err : 'An error occurred during watermark update.');
    return { success: false, error: message };
  }
}
