/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServerActionResponse, EventMemberRole } from './event_members';
import { createNotification } from './notifications';
import { sendRoleRequestEmail, sendRoleDecisionEmail } from '@/lib/email';

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
    
    // Get event name and admins to notify
    const { data: eventData } = await supabase.from('events').select('name').eq('id', eventId).single();
    const eventName = eventData?.name || 'an event';
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const userName = profile?.full_name || 'A user';

    const { data: admins } = await supabase
      .from('event_members')
      .select('user_id, profiles(email)')
      .eq('event_id', eventId)
      .in('role', ['owner', 'admin']);

    if (admins) {
      for (const admin of admins) {
        if (!admin.user_id) continue;
        await createNotification({
          user_id: admin.user_id,
          actor_id: user.id,
          type: 'role_request',
          category: 'event',
          title: 'New Access Request',
          description: `${userName} requested ${requestedRole} access to ${eventName}.`,
          action_url: `/events/${eventId}/settings`,
          icon: 'shield-alert' // Just a fallback, UI will render its own
        });
        
        const adminEmail = (admin.profiles as any)?.email;
        if (adminEmail) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await sendRoleRequestEmail(adminEmail, userName, eventName, requestedRole, `${baseUrl}/events/${eventId}/settings`);
        }
      }
    }
    
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
    
    // Fetch requester info and event name for notification
    const { data: eventData } = await supabase.from('events').select('name').eq('id', eventId).single();
    const eventName = eventData?.name || 'an event';
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
    
    const { data: { user } } = await supabase.auth.getUser();

    // Trigger Notification
    await createNotification({
      user_id: userId,
      actor_id: user?.id,
      type: action === 'approve' ? 'role_approved' : 'role_rejected',
      category: 'event',
      title: action === 'approve' ? 'Access Approved' : 'Access Rejected',
      description: `Your request for ${requestedRole} access to ${eventName} was ${action}.`,
      action_url: `/events/${eventId}`,
      icon: action === 'approve' ? 'check' : 'x'
    });

    if (profile?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await sendRoleDecisionEmail(profile.email, eventName, requestedRole, action === 'approve' ? 'approved' : 'rejected', `${baseUrl}/events/${eventId}`);
    }
    
    revalidatePath(`/events/${eventId}/settings`);
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || `Failed to ${action} request` };
  }
}
