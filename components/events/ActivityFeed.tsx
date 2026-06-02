'use client';

import React from 'react';
import { Activity, Image as ImageIcon, UserPlus, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    user: string;
    action: string;
    target: string;
    targetId: string;
    time: string;
  }>;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  // Use real activities if available, fallback to empty state
  const displayActivities = activities.length > 0 ? activities : [];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Activity className="w-5 h-5 text-slate-700" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-wide">Live Activity</h3>
      </div>

      {displayActivities.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-500">No recent activity yet.</div>
      ) : (
        <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
          {displayActivities.map((item) => {
            const Icon = ImageIcon; // Fallback icon for real data
            const color = 'text-indigo-500';
          return (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon / Marker */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">{item.user}</span>
                  <time className="text-[10px] font-bold text-slate-400 uppercase">{item.time}</time>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {item.action} <Link href={`/events/${item.targetId}`} className="font-bold text-indigo-600 hover:underline">{item.target}</Link>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
