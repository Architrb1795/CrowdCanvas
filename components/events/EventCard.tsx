'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Tag, Globe, Lock, Image as ImageIcon, Users, ArrowRight, Settings, Sparkles, ScanFace, Activity, Eye } from 'lucide-react';
import { EventWithProfile } from '@/lib/actions/events';

interface EventCardProps {
  event: EventWithProfile;
}

export default function EventCard({ event }: EventCardProps) {
  const [showPreview, setShowPreview] = useState(false);

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
  const mediaCount = event.mediaCount || 0; // fallback for preview removed Math.random() to fix purity
  const participantCount = event.memberCount || 0;

  // Simulate AI Status (Since we don't have this in DB yet, we mock it for the premium feel)
  const isAiIndexed = mediaCount > 0;
  const hasFaceSearch = mediaCount > 10;

  return (
    <motion.article 
      layout
      className="group relative flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 h-full"
    >
      {/* Visual Cover Banner with Gradient Placeholder or Image */}
      <div 
        className={`relative h-48 w-full ${!event.cover_url ? 'bg-gradient-to-r ' + gradient : 'bg-slate-900'} flex items-end p-5 transition-all duration-500 overflow-hidden`}
      >
        {event.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={event.cover_url} 
            alt={`Cover for ${event.name}`}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_1px)] bg-[size:16px_16px] group-hover:scale-110 transition-transform duration-700"></div>
        )}
        
        {/* Overlay Gradient for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full flex justify-between items-end">
          {/* Category Badge inside cover */}
          {event.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 rounded-full text-xs font-bold text-white tracking-wide transition-colors">
              <Tag className="w-3.5 h-3.5" />
              {event.category}
            </span>
          )}

          {/* Quick Preview Toggle Button */}
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all shadow-lg"
            title="Quick Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* AI Indicators Floating on top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isAiIndexed && (
            <div className="px-2 py-1 rounded-md bg-indigo-500/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" /> AI Indexed
            </div>
          )}
          {hasFaceSearch && (
            <div className="px-2 py-1 rounded-md bg-purple-500/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <ScanFace className="w-3 h-3" /> Face Search
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
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

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formattedDate}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
          {event.name}
        </h3>

        {/* Description Preview */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-5 leading-relaxed font-medium">
          {event.description || 'Join this exciting club event to connect, participate, and explore high quality content.'}
        </p>

        {/* Expanded Quick Preview State */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Recent Activity:</span>
                  <span className="text-slate-500 font-normal">15 new photos added today</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>AI Summary:</span>
                  <span className="text-slate-500 font-normal line-clamp-1">A highly energetic cultural fest with lots of music and dance.</span>
                </div>
                {/* Mock recent members avatars */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-slate-500 font-normal">+ {participantCount} joined</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Metrics */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span>{mediaCount} Photos</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>{participantCount} Members</span>
          </div>
        </div>
      </div>

      {/* Action footer wrapper */}
      <div className="flex border-t border-slate-100/80 bg-slate-50">
        <Link 
          href={`/events/${event.id}`}
          className={`flex-1 hover:bg-indigo-600 px-6 py-4 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 hover:text-white transition-colors group/link ${
            (event.currentUserRole === 'owner' || event.currentUserRole === 'admin') ? 'border-r border-slate-200/60' : ''
          }`}
          aria-label={`View photos and media uploads for event: ${event.name}`}
        >
          <span>Open Hub</span>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </Link>
        
        {(event.currentUserRole === 'owner' || event.currentUserRole === 'admin') && (
          <Link
            href={`/events/${event.id}/settings`}
            className="flex-shrink-0 hover:bg-slate-200/50 px-6 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
            aria-label={`Manage event: ${event.name}`}
            title="Manage Event"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>
    </motion.article>
  );
}
