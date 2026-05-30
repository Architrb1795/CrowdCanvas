import { createClient } from '@/lib/supabase/server';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import RequestAccessButton from '@/components/events/RequestAccessButton';
import MediaGalleryGrid from '@/components/media/MediaGalleryGrid';
import AdminDiagnosticsPanel from '@/components/media/AdminDiagnosticsPanel';

// NOTE: In Next.js 14, page props searchParams are a standard synchronous object or Promise depending on config, but typing them standard is fine.
export default async function MediaPage(
  props: {
    searchParams?: Promise<{ eventId?: string; debug?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const eventId = searchParams?.eventId;
  const isDebug = searchParams?.debug === 'true';
  const supabase = await createClient();

  let query = supabase
    .from('media')
    .select('*, events(name), profiles(full_name)')
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;
  
  let eventName = 'All Media';
  if (eventId) {
    const { data: evt } = await supabase.from('events').select('name').eq('id', eventId).single();
    if (evt) eventName = `Media for ${evt.name}`;
  }

  interface MediaWithRelations {
    id: string;
    event_id: string | null;
    file_url: string;
    media_type: 'photo' | 'video' | null;
    uploaded_by: string | null;
    tags: string[] | null;
    is_private: boolean;
    created_at: string;
    events: {
      name: string;
    } | null;
    profiles: {
      full_name: string | null;
    } | null;
  }

  const mediaItems = data as unknown as MediaWithRelations[] | null;
  const { data: { user } } = await supabase.auth.getUser();
  
  let canUpload = false;
  let canManageEvent = false;
  let hasPendingRequest = false;
  
  if (user) {
    if (eventId) {
      const { data: memberData } = await supabase
        .from('event_members')
        .select('role')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();
        
      if (memberData && ['owner', 'admin', 'uploader'].includes(memberData.role)) {
        canUpload = true;
        if (memberData.role === 'owner' || memberData.role === 'admin') {
          canManageEvent = true;
        }
      } else {
        const { data: pending } = await supabase
          .from('event_role_requests')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();
        hasPendingRequest = !!pending;
      }
    } else {
      // Global fallback if no event is selected
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as unknown as { data: { role: string } | null };
      canUpload = profile?.role === 'admin' || profile?.role === 'photographer';
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {eventName}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Browse through all available photos and videos.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
           {eventId && (
             <Link href="/events" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm border border-white/10 hover:bg-slate-800">
               &larr; Back to Events
             </Link>
           )}
          {canManageEvent && eventId && (
            <Link href={`/events/${eventId}/settings`} className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700">
              Manage Event
            </Link>
          )}
          {canUpload ? (
            <Link href="/upload" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Media
            </Link>
          ) : eventId ? (
            <RequestAccessButton eventId={eventId} hasPending={hasPendingRequest} />
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-100">
          <p className="text-sm font-medium text-red-800">Error loading media: {error.message}</p>
        </div>
      ) : mediaItems?.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl shadow-sm border border-white/5">
          <ImageIcon className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-2 text-sm font-semibold text-white">No media found</h3>
          <p className="mt-1 text-sm text-slate-400">
            {canUpload ? 'Be the first to upload photos or videos.' : 'Check back later for updates.'}
          </p>
        </div>
      ) : (
        <div>
          {isDebug && <AdminDiagnosticsPanel mediaItems={mediaItems || []} />}
          <MediaGalleryGrid 
            mediaItems={mediaItems || []} 
            canManageEvent={canManageEvent}
            currentUserId={user?.id}
          />
        </div>
      )}
    </div>
  );
}
