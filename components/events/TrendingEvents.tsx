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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-wide">Trending Events</h3>
        </div>
        <Link href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
      </div>

      <ul className="space-y-4">
        {trending.map((event, i) => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`} className="group flex items-center gap-4 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
              <div className="text-2xl font-black text-slate-200 w-6 text-center group-hover:text-indigo-200 transition-colors">
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 flex items-center gap-2">
                  {event.name}
                  {event.isHot && <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                </h4>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{event.metric}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
