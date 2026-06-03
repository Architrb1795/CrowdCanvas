import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getEvents, getPinnedEvents } from '@/lib/actions/events';

// New Premium Components
import EventHero from '@/components/events/EventHero';
import PlatformStats from '@/components/events/PlatformStats';
import EventGallery from '@/components/events/EventGallery';
import EventRecommendations from '@/components/events/EventRecommendations';
import TrendingEvents from '@/components/events/TrendingEvents';
import ActivityFeed from '@/components/events/ActivityFeed';
import PersonalizedDashboard from '@/components/events/PersonalizedDashboard';

export const revalidate = 0; // Disable server cache to ensure fresh data retrieval on every visit

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Resolve user authenticated session
  const { data: { user } } = await supabase.auth.getUser();

  let userName = 'Explorer';
  let userMediaCount = 0;
  let userFacesFound = 0;
  let pinnedEventIds: string[] = [];

  if (user) {
    // Parallelize user-specific data fetching
    const [profileRes, mediaCountRes, facesFoundRes, pinnedEventsRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('media').select('*', { count: 'exact', head: true }).eq('uploaded_by', user.id),
      supabase.from('photo_user_tags').select('*', { count: 'exact', head: true }).eq('tagged_user_id', user.id),
      getPinnedEvents()
    ]);
    
    userName = profileRes.data?.full_name?.split(' ')[0] || 'Explorer';
    userMediaCount = mediaCountRes.count || 0;
    userFacesFound = facesFoundRes.count || 0;
    pinnedEventIds = pinnedEventsRes.data || [];
  }

  // Fetch events using server actions
  const response = await getEvents();
  const events = response.data || [];
  const errorMsg = response.success ? undefined : (response.error || 'Failed to sync with Supabase.');

  // Calculate live database metrics for Stats Panel
  const totalCount = events.length;
  const publicCount = events.filter((e) => e.is_public).length;
  const privateCount = totalCount - publicCount;
  const totalMedia = events.reduce((acc, curr) => acc + (curr.mediaCount || 0), 0);
  const totalMembers = events.reduce((acc, curr) => acc + (curr.memberCount || 0), 0);

  // Fetch global platform stats & trends
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [globalFacesRes, recentMediaRes, mediaTodayRes, membersWeekRes, tagsTodayRes] = await Promise.all([
    supabase.from('photo_user_tags').select('*', { count: 'exact', head: true }),
    supabase.from('media')
      .select('id, created_at, profiles(full_name), events(id, name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('media').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('event_members').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
    supabase.from('photo_user_tags').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
  ]);
  
  const facesIndexed = globalFacesRes.count || 0;
  const eventsThisWeek = events.filter(e => new Date(e.created_at) > oneWeekAgo).length;
  const mediaTodayCount = mediaTodayRes.count || 0;
  const membersWeekCount = membersWeekRes.count || 0;
  const tagsTodayCount = tagsTodayRes.count || 0;
  
  // Format recent activity
  const recentActivity = (recentMediaRes.data || []).map((m) => ({
    id: m.id,
    user: m.profiles?.full_name || 'Someone',
    action: 'uploaded a photo to',
    target: m.events?.name || 'an event',
    targetId: m.events?.id || '',
    time: timeAgo(m.created_at)
  }));

  const userEventsJoined = events.filter(e => e.currentUserRole !== null).length;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-24">
      {/* PHASE 2: Premium Hero Section */}
      <EventHero />

      {/* PHASE 3: Live Platform Stats */}
      <PlatformStats 
        totalCount={totalCount}
        publicCount={publicCount}
        privateCount={privateCount}
        totalMedia={totalMedia}
        totalMembers={totalMembers}
        facesIndexed={facesIndexed} 
        eventsTrend={`+${eventsThisWeek} THIS WEEK`}
        mediaTrend={`+${mediaTodayCount} TODAY`}
        membersTrend={`+${membersWeekCount} THIS WEEK`}
        facesTrend={`+${tagsTodayCount} TODAY`}
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12" id="discovery-panel">
        
        {/* PHASE 10 & 11: Personalized Dashboard (Shown if logged in) */}
        {user && (
          <PersonalizedDashboard 
            userName={userName} 
            facesFound={userFacesFound}
            eventsJoined={userEventsJoined}
            mediaUploaded={userMediaCount}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          
          {/* Left Column (Main Content) */}
          <div className="flex-1 space-y-8">
            
            {/* PHASE 4, 5, 6: Smart Discovery & Event Gallery */}
            <div>
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Discover Events</h2>
              </div>
              <EventGallery initialEvents={events} errorMsg={errorMsg} pinnedEventIds={pinnedEventIds} />
            </div>

          </div>

          {/* Right Column (Sidebar Modules for Phase 7, 8, 9) */}
          <div className="w-full lg:w-[350px] shrink-0 space-y-6">
            
            {/* PHASE 7: Recommendations */}
            <EventRecommendations events={events} />
            
            {/* PHASE 9: Social Feed */}
            <ActivityFeed activities={recentActivity} />

            {/* PHASE 8: Trending Events */}
            <TrendingEvents events={events} />

          </div>
        </div>
      </div>
    </main>
  );
}
