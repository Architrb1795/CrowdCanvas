'use client';

import React from 'react';
import { Flame, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

import type { EventWithProfile } from '@/lib/actions/events';

interface TrendingEventsProps {
  events: EventWithProfile[];
}

export default function TrendingEvents({ events }: TrendingEventsProps) {
  // Sort real events by member count
  const trending = [...events]
    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
    .slice(0, 4)
    .map(e => ({
      id: e.id,
      name: e.name,
      metric: `${e.memberCount || 0} Members`,
      isHot: (e.memberCount || 0) > 10
    }));

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl shadow-inner">
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Trending Events</h3>
        </div>
        <Link href="#" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">View All</Link>
      </div>

      <ul className="space-y-3 relative z-10">
        {trending.map((event, i) => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`} className="group/item flex items-center gap-4 bg-slate-800/40 hover:bg-slate-800/80 p-3 rounded-2xl transition-all border border-white/5 hover:border-white/10 hover:shadow-lg">
              <div className="text-2xl font-black text-slate-700 w-8 text-center group-hover/item:text-indigo-400 transition-colors drop-shadow-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors line-clamp-1 flex items-center gap-2">
                  {event.name}
                  {event.isHot && <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                </h4>
                <div className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-slate-500" />
                  {event.metric}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
