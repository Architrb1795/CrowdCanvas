import { createClient } from '@/lib/supabase/server';
import { Image as ImageIcon, Video, UploadCloud } from 'lucide-react';
import Link from 'next/link';

// NOTE: In Next.js 14, page props searchParams are a standard synchronous object or Promise depending on config, but typing them standard is fine.
export default async function MediaPage(
  props: {
    searchParams?: Promise<{ eventId?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const eventId = searchParams?.eventId;
  const supabase = await createClient();

  let query = supabase
    .from('media')
    .select('*, events(name), profiles(full_name)')
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

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
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as unknown as { data: { role: string } | null };
    canUpload = profile?.role === 'admin' || profile?.role === 'photographer';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {eventId && mediaItems?.[0]?.events ? `Media for ${mediaItems[0].events.name}` : 'All Media'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse through all available photos and videos.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
           {eventId && (
             <Link href="/events" className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50">
               &larr; Back to Events
             </Link>
           )}
          {canUpload && (
            <button className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Media
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-100">
          <p className="text-sm font-medium text-red-800">Error loading media: {error.message}</p>
        </div>
      ) : mediaItems?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No media found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canUpload ? 'Be the first to upload photos or videos.' : 'Check back later for updates.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {mediaItems?.map((media) => (
            <div key={media.id} className="break-inside-avoid relative group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200 bg-gray-100">
              {media.media_type === 'video' ? (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                   <Video className="h-8 w-8 text-white opacity-50" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={media.file_url} 
                  alt="Event media" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                 <p className="text-white text-sm font-medium">
                   Uploaded by {media.profiles?.full_name || 'Unknown'}
                 </p>
                 {media.tags && media.tags.length > 0 && (
                   <div className="flex gap-2 mt-2 flex-wrap">
                     {media.tags.map((tag: string) => (
                       <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-xs text-white">
                         {tag}
                       </span>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
