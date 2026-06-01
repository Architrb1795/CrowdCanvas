'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Tag, Globe, Lock, Image as ImageIcon, Users, ArrowRight, Settings } from 'lucide-react';
import { EventWithProfile } from '@/lib/actions/events';

interface EventCardProps {
  event: EventWithProfile;
}

export default function EventCard({ event }: EventCardProps) {
  // Safe date parsing
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBD';

  // Gradient Cover Generator based on Category or Name Hash to keep it premium and unique
  const getGradientClass = (category: string | null) => {
    const cat = (category || 'default').toLowerCase();
    switch (cat) {
      case 'workshop':
      case 'academic':
        return 'from-blue-600 to-indigo-600';
      case 'cultural':
      case 'festival':
        return 'from-pink-500 to-rose-500';
      case 'sports':
      case 'outdoor':
        return 'from-emerald-500 to-teal-500';
      case 'social':
      case 'networking':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-indigo-500 via-purple-500 to-pink-500';
    }
  };

  const gradient = getGradientClass(event.category);

  // Real metrics from DB
  const mediaCount = event.mediaCount || 0;
  const participantCount = event.memberCount || 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300 transition-all duration-300 h-full">
      {/* Visual Cover Banner with Gradient Placeholder or Image */}
      <div 
        className={`relative h-32 w-full ${!event.cover_url ? 'bg-gradient-to-r ' + gradient : 'bg-slate-900'} flex items-end p-4 transition-all duration-300 group-hover:brightness-105`}
      >
        {event.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={event.cover_url} 
            alt={`Cover for ${event.name}`}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
        )}
        
        {/* Glassmorphic Category Badge inside cover */}
        {event.category && (
          <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 rounded-full text-xs font-semibold text-white tracking-wide transition-colors">
            <Tag className="w-3.5 h-3.5" />
            {event.category}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6">
        {/* Visibility Badge & Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              event.is_public
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}
          >
            {event.is_public ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Private
              </>
            )}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formattedDate}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
          {event.name}
        </h3>

        {/* Description Preview */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-5 leading-relaxed">
          {event.description || 'Join this exciting club event to connect, participate, and explore high quality content.'}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <span>{mediaCount} Photos</span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{participantCount} Members</span>
          </div>
        </div>
      </div>

      {/* Action footer wrapper */}
      <div className="flex border-t border-slate-100/80 bg-slate-50">
        <Link 
          href={`/events/${event.id}`}
          className={`flex-1 hover:bg-indigo-50 px-6 py-3.5 flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-all group/link ${
            (event.currentUserRole === 'owner' || event.currentUserRole === 'admin') ? 'border-r border-slate-200/60' : ''
          }`}
          aria-label={`View photos and media uploads for event: ${event.name}`}
        >
          <span>View Event Dashboard</span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover/link:translate-x-1 group-hover/link:text-indigo-600 transition-all" />
        </Link>
        
        {(event.currentUserRole === 'owner' || event.currentUserRole === 'admin') && (
          <Link
            href={`/events/${event.id}/settings`}
            className="flex-shrink-0 hover:bg-slate-200/50 px-5 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
            aria-label={`Manage event: ${event.name}`}
            title="Manage Event"
          >
            <Settings className="w-4.5 h-4.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
