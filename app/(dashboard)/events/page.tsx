import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getEvents } from '@/lib/actions/events';
import EventGallery from '@/components/events/EventGallery';
import CreateEventTrigger from '@/components/events/CreateEventTrigger';
import { CalendarRange, Globe, Shield, Sparkles } from 'lucide-react';

export const revalidate = 0; // Disable server cache to ensure fresh data retrieval on every visit

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Resolve user authenticated session and database credentials
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null };
    
    isAdmin = profile?.role === 'admin';
  }

  // Fetch events using server actions
  const response = await getEvents();
  const events = response.data || [];
  const errorMsg = response.success ? undefined : (response.error || 'Failed to sync with Supabase.');

  // Calculate live database metrics for Stats Panel
  const totalCount = events.length;
  const publicCount = events.filter((e) => e.is_public).length;
  const privateCount = totalCount - publicCount;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Visual Premium Hero Section */}
      <section 
        className="relative bg-slate-900 overflow-hidden py-16 sm:py-20 border-b border-slate-800"
        aria-label="Events Dashboard Banner"
      >
        {/* Abstract futuristic grid layout overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                CrowdCanvas core
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                Event Hub
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Discover campus gatherings, workshops, festivals, and activities. Upload, organize, and interact with live media archives.
              </p>
            </div>
            
            {/* Modal creator trigger only visible to Admin roles */}
            <div className="flex-shrink-0">
              <CreateEventTrigger isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Panel */}
      <section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20"
        aria-label="Event Statistics"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-md border border-slate-200/65">
          {/* Stat 1: Total */}
          <div className="flex items-center gap-4 px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-100">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <CalendarRange className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalCount}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Events</div>
            </div>
          </div>

          {/* Stat 2: Public */}
          <div className="flex items-center gap-4 px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-100">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{publicCount}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide text-emerald-700">Public Access</div>
            </div>
          </div>

          {/* Stat 3: Private */}
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{privateCount}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide text-amber-700">Private restricted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Dashboard & Gallery */}
      <section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        aria-label="Event Listing"
      >
        <EventGallery initialEvents={events} errorMsg={errorMsg} />
      </section>
    </main>
  );
}
