import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EventDashboardClient from './EventDashboardClient';

export const revalidate = 0;

export default async function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const eventId = params.id;
  const supabase = await createClient();

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*, profiles(full_name)')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // Fetch Media for this event
  const { data: mediaItems } = await supabase
    .from('media')
    .select('*, profiles(full_name), likes(count), comments(count)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  // Fetch Watermarked Downloads Count
  let watermarkedDownloadsCount = 0;
  if (mediaItems && mediaItems.length > 0) {
    const { count } = await supabase
      .from('shares')
      .select('*', { count: 'exact', head: true })
      .eq('share_type', 'download')
      .eq('is_watermarked', true)
      .in('media_id', mediaItems.map(m => m.id));
    watermarkedDownloadsCount = count || 0;
  }

  // Verify access (Public or Member)
  let hasAccess = event.is_public;
  let memberRole = null;
  
  let canUpload = false;
  let hasPendingRequest = false;

  if (user) {
    const { data: member } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
      
    if (member) {
      hasAccess = true;
      memberRole = member.role;
      if (['owner', 'admin', 'uploader'].includes(memberRole)) {
        canUpload = true;
      }
    }

    if (!canUpload) {
      const { data: pending } = await supabase
        .from('event_role_requests')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();
      hasPendingRequest = !!pending;
    }
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Private Event</h1>
          <p className="text-slate-400">You do not have permission to view this event.</p>
        </div>
      </div>
    );
  }

  const canManageEvent = memberRole === 'owner' || memberRole === 'admin';

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <EventDashboardClient 
        event={event} 
        mediaItems={mediaItems || []} 
        canManageEvent={canManageEvent} 
        canUpload={canUpload}
        hasPendingRequest={hasPendingRequest}
        currentUserId={user?.id}
        watermarkedDownloadsCount={watermarkedDownloadsCount}
      />
    </main>
  );
}
