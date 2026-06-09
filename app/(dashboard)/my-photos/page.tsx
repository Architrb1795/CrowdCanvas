import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyPhotosClient } from './MyPhotosClient';

export const metadata = {
  title: 'My Photos | CrowdCanvas',
  description: 'Your personalized photo gallery discovered by AI face recognition.',
};

export default async function MyPhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has a face profile
  const { data: profile } = await supabase
    .from('face_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    // Redirect to profile page to set up face recognition
    redirect('/profile');
  }

  // Fetch face matches
  const { data: matches, error } = await supabase
    .from('face_matches')
    .select(`
      id,
      similarity_score,
      status,
      media (
        id,
        file_url,
        thumbnail_url,
        media_type,
        created_at,
        events (
          id,
          name,
          event_date
        )
      )
    `)
    .eq('face_profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching face matches:', error);
  }

  const eventsMap = new Map();
  const validMatches = (matches || []).filter(m => m.media && m.media.events);

  for (const match of validMatches) {
    const event = match.media.events;
    if (!event) continue;

    if (!eventsMap.has(event.id)) {
      eventsMap.set(event.id, {
        id: event.id,
        name: event.name,
        date: event.event_date,
        photosMap: new Map() // Use map to deduplicate by media_id
      });
    }
    
    const eventData = eventsMap.get(event.id);
    const mediaId = match.media.id;
    
    // Only keep the highest similarity match for a given media file
    if (!eventData.photosMap.has(mediaId) || eventData.photosMap.get(mediaId).similarity < match.similarity_score) {
      eventData.photosMap.set(mediaId, {
        id: mediaId,
        matchId: match.id,
        url: match.media.file_url,
        thumbnailUrl: match.media.thumbnail_url,
        type: match.media.media_type,
        similarity: match.similarity_score,
        status: match.status,
        createdAt: match.media.created_at
      });
    }
  }

  const groupedEvents = Array.from(eventsMap.values()).map(event => ({
    id: event.id,
    name: event.name,
    date: event.date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: Array.from(event.photosMap.values()) as any[]
  }));

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <MyPhotosClient groupedEvents={groupedEvents} />
    </main>
  );
}
