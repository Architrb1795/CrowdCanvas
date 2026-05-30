/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServerActionResponse, EventMemberRole } from './event_members';

export interface RoleRequest {
  id: string;
  event_id: string;
  user_id: string;
  requested_role: EventMemberRole;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

// Request upload access (viewer -> uploader or not_in_event -> uploader)
export async function createRoleRequest(eventId: string, requestedRole: EventMemberRole = 'uploader'): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if a pending request already exists
    const { data: existing } = await supabase
      .from('event_role_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return { success: false, error: 'You already have a pending request for this event.' };
    }

    const { error } = await supabase
      .from('event_role_requests')
      .insert({
        event_id: eventId,
        user_id: user.id,
        requested_role: requestedRole,
        status: 'pending'
      });

    if (error) throw error;
    
    // Note: We don't trigger email notifications here as per instructions, 
    // it will just appear in the admin's settings dashboard.
    
    revalidatePath(`/events/${eventId}`);
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit request' };
  }
}

// Get pending requests for an event (admins only)
export async function getPendingRequests(eventId: string): Promise<ServerActionResponse<RoleRequest[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_role_requests')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { success: true, data: data as unknown as RoleRequest[] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load requests' };
  }
}

// Check if user has a pending request
export async function hasPendingRequest(eventId: string): Promise<ServerActionResponse<boolean>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: true, data: false };

    const { data } = await supabase
      .from('event_role_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();
      
    return { success: true, data: !!data };
  } catch (err: any) {
    // If it's just a PGRST116 (not found), return false
    if (err.code === 'PGRST116') {
      return { success: true, data: false };
    }
    return { success: false, error: err.message };
  }
}

// Resolve request (Approve/Reject)
export async function resolveRoleRequest(requestId: string, eventId: string, userId: string, requestedRole: EventMemberRole, action: 'approve' | 'reject'): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    // 1. Update the request status
    const { error: updateError } = await supabase
      .from('event_role_requests')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', requestId);
      
    if (updateError) throw updateError;

    // 2. If approved, add/update the user in event_members
    if (action === 'approve') {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('event_members')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
        
      if (existingMember) {
        // Upgrade role
        const { error: upgradeError } = await supabase
          .from('event_members')
          .update({ role: requestedRole })
          .eq('id', existingMember.id);
        if (upgradeError) throw upgradeError;
      } else {
        // Insert new member
        const { error: insertError } = await supabase
          .from('event_members')
          .insert({
            event_id: eventId,
            user_id: userId,
            role: requestedRole
          });
        if (insertError) throw insertError;
      }
    }
    
    revalidatePath(`/events/${eventId}/settings`);
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || `Failed to ${action} request` };
  }
}
