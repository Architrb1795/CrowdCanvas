import React from 'react';
import { createClient } from '@/lib/supabase/server';
import UploadDashboardClient from './UploadDashboardClient';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function UploadDashboardPage() {
  const supabase = await createClient();
  
  // Verify Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch events where the user is authorized to upload
  const { data: memberData } = await supabase
    .from('event_members')
    .select('events(id, name, event_date)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin', 'uploader']);

  const events = memberData
    ?.map(m => m.events)
    .filter(Boolean) as unknown as Array<{ id: string; name: string; event_date: string | null }>;

  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
          <p className="text-slate-400">You do not have upload access to any events. Please contact an event admin to grant you Uploader permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <UploadDashboardClient initialEvents={events || []} />
    </main>
  );
}
