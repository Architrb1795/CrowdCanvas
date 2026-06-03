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
        <div className="space-y-4">
          {displayActivities.map((item, index) => {
            const Icon = ImageIcon; // Fallback icon for real data
            const color = 'text-indigo-500';
            // Generate a deterministic background color for the avatar based on the user's name
            const bgColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500'];
            const avatarBg = bgColors[item.user.length % bgColors.length];
            const initial = item.user.charAt(0).toUpperCase();

          return (
            <div key={item.id} className="group relative flex items-start gap-3 p-3 rounded-2xl transition-all hover:bg-slate-50 hover:shadow-sm">
              {/* Avatar + Icon Badge */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarBg} shadow-inner`}>
                  {initial}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                  <Icon className={`w-3 h-3 ${color}`} />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 leading-snug">
                  <span className="font-bold">{item.user}</span> {item.action}{' '}
                  <Link href={`/events/${item.targetId}`} className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                    {item.target}
                  </Link>
                </div>
                <time className="text-xs text-slate-500 mt-0.5 block">{item.time}</time>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
