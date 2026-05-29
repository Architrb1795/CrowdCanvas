'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EventWithProfile {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  category: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    role: 'admin' | 'photographer' | 'member' | 'viewer';
  } | null;
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
    
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }

    const formattedEvents = data as unknown as EventWithProfile[] | null;

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

    // Check permissions - only admin can create events
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null; error: { message: string } | null };

    if (profileError || !profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Only administrators can create events.' };
    }

    // Destructure and validate input
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const event_date = formData.get('event_date') as string;
    const category = formData.get('category') as string;
    const is_public = formData.get('is_public') === 'true';

    if (!name || name.trim() === '') {
      return { success: false, error: 'Event name is required.' };
    }

    if (!event_date) {
      return { success: false, error: 'Event date is required.' };
    }

    // Insert new event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newEvent, error: insertError } = await (supabase.from('events') as any).insert({
      name: name.trim(),
      description: description ? description.trim() : null,
      event_date,
      category: category ? category : null,
      is_public,
      created_by: user.id,
    }).select().single() as unknown as { data: EventWithProfile | null; error: { message: string } | null };

    if (insertError || !newEvent) {
      return {
        success: false,
        error: insertError?.message || 'Failed to record new event.',
      };
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
