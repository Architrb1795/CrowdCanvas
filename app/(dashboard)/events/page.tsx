import { createClient } from '@/lib/supabase/server';
import { Calendar, Users, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function EventsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*, profiles(full_name, role)')
    .order('event_date', { ascending: true });

  interface EventWithProfile {
    id: string;
    name: string;
    description: string | null;
    event_date: string | null;
    category: string | null;
    is_public: boolean;
    created_by: string | null;
    created_at: string;
    profiles: {
      full_name: string | null;
      role: 'admin' | 'photographer' | 'member' | 'viewer';
    } | null;
  }

  const events = data as unknown as EventWithProfile[] | null;

  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as unknown as { data: { role: string } | null };
    isAdmin = profile?.role === 'admin';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all upcoming and past events. Private events are only visible to members.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isAdmin && (
            <button className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              Create New Event
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-100">
          <p className="text-sm font-medium text-red-800">Error loading events: {error.message}</p>
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Link 
              href={`/media?eventId=${event.id}`} 
              key={event.id}
              className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.is_public ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {event.is_public ? 'Public' : 'Private'}
                  </span>
                  {!event.is_public && <ShieldAlert className="h-4 w-4 text-amber-600" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description || 'No description provided.'}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'TBD'}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  Organized by {event.profiles?.full_name || 'Unknown'}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View Media &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
