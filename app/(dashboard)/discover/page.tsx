import React from 'react';
import { createClient } from '@/lib/supabase/server';
import DiscoverClient from './DiscoverClient';
import { Compass } from 'lucide-react';

export const metadata = {
  title: 'Discover - CrowdCanvas',
};

export const revalidate = 0;

export default async function DiscoverPage() {
  const supabase = await createClient();

  // Fetch only public media that has been processed by AI
  const { data: mediaItems, error } = await supabase
    .from('media')
    .select('*, events!inner(name, is_public), profiles(full_name)')
    .eq('events.is_public', true)
    .eq('ai_processed', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Discover error:', error);
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
          <Compass className="w-8 h-8 text-indigo-500" />
          Discovery Feed
        </h1>
        <p className="text-slate-400">
          Explore the most engaging moments captured across the campus, intelligently curated by our AI engine.
        </p>
      </div>

      {mediaItems && mediaItems.length > 0 ? (
        <DiscoverClient initialMedia={mediaItems} />
      ) : (
        <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-slate-400">No public AI-processed media available yet.</p>
        </div>
      )}
    </div>
  );
}
