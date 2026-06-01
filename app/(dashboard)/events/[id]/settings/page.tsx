import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EventSettingsClient from '@/components/events/EventSettingsClient';
import { getEventMembers } from '@/lib/actions/event_members';
import { getPendingRequests } from '@/lib/actions/role_requests';

export default async function EventSettingsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const eventId = params.id;

  // Verify event exists and fetch details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // Verify member access
  const { data: memberData } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center pt-20 px-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
          <p className="text-slate-400">You must be the Event Owner or an Event Admin to manage settings for this event.</p>
        </div>
      </div>
    );
  }

  // Fetch initial members
  const membersResponse = await getEventMembers(eventId);
  const initialMembers = membersResponse.success && membersResponse.data ? membersResponse.data : [];

  // Fetch pending role requests
  const requestsResponse = await getPendingRequests(eventId);
  const initialRequests = requestsResponse.success && requestsResponse.data ? requestsResponse.data : [];

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <EventSettingsClient 
        eventId={eventId} 
        event={event}
        initialMembers={initialMembers}
        initialRequests={initialRequests}
        currentUserRole={memberData.role as 'owner' | 'admin'}
        currentUserId={user.id}
      />
    </main>
  );
}
