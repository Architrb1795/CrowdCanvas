'use client';

import React from 'react';
import { Sparkles, ArrowRight, ScanFace, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

import type { EventWithProfile } from '@/lib/actions/events';

interface EventRecommendationsProps {
  events: EventWithProfile[];
}

export default function EventRecommendations({ events }: EventRecommendationsProps) {
  // Recommend public events where user is NOT a member
  const recommendations = [...events]
    .filter(e => e.is_public && e.currentUserRole === null)
    .sort((a, b) => (b.mediaCount || 0) - (a.mediaCount || 0))
    .slice(0, 3)
    .map((e, idx) => {
      const icons = [Sparkles, ImageIcon, ScanFace];
      const colors = ['text-amber-500', 'text-indigo-500', 'text-emerald-500'];
      const bgs = ['bg-amber-50', 'bg-indigo-50', 'bg-emerald-50'];
      
      return {
        id: e.id,
        name: e.name,
        reason: e.mediaCount && e.mediaCount > 0 ? `Highly active with ${e.mediaCount} photos.` : 'Popular new public event.',
        icon: icons[idx % icons.length],
        color: colors[idx % colors.length],
        bg: bgs[idx % bgs.length]
      };
    });

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Sparkles className="w-5 h-5 text-indigo-300" />
        <h3 className="text-lg font-bold text-white tracking-wide">Recommended For You</h3>
      </div>

      <div className="space-y-4 relative z-10">
        {recommendations.map(rec => {
          const Icon = rec.icon;
          return (
            <Link key={rec.id} href={`/events/${rec.id}`} className="group block">
              <div className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">{rec.name}</h4>
                    <p className="text-xs text-indigo-200/70 mt-1 font-medium">{rec.reason}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
