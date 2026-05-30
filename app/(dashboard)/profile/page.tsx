import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileDashboardClient from './ProfileDashboardClient';
import { getProfile, getUserUploads, getUserEvents } from '@/lib/actions/profile';

export const metadata = {
  title: 'Profile | CrowdCanvas',
  description: 'Manage your CrowdCanvas profile and account settings.',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all required data in parallel
  const [profileRes, uploadsRes, eventsRes] = await Promise.all([
    getProfile(),
    getUserUploads(),
    getUserEvents()
  ]);

  if (!profileRes.success || !profileRes.data) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center">
        <h1 className="text-2xl font-bold text-white">Error loading profile</h1>
        <p className="text-slate-400 mt-2">{profileRes.error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <ProfileDashboardClient 
        profile={profileRes.data} 
        uploads={uploadsRes.data || []}
        events={eventsRes.data || []}
      />
    </main>
  );
}
