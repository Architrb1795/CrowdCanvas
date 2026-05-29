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

  // Fetch profiles role to verify upload permissions (admin or photographer)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'viewer';
  if (role !== 'admin' && role !== 'photographer') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
          <p className="text-slate-400">You must be a verified Photographer or Admin to upload media to the CrowdCanvas platform.</p>
        </div>
      </div>
    );
  }

  // Fetch available events for the dropdown
  // Admins see all, Photographers might see all public or specific ones (we show all active for now)
  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <UploadDashboardClient initialEvents={events || []} />
    </main>
  );
}
