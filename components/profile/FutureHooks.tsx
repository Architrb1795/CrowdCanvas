'use client';

import React from 'react';
import { Bell, Search, UserCheck, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function FutureHooks() {
  return (
    <div className="pt-12 border-t border-white/5 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl font-bold text-white">Coming Soon</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">Beta Features</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-white/5 bg-slate-900/20 border-dashed opacity-70 hover:opacity-100 transition-opacity flex items-start gap-4 cursor-not-allowed">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Notification Center</h4>
            <p className="text-sm text-slate-400 mt-1">Push notifications for event updates, role changes, and new media uploads.</p>
          </div>
        </Card>

        <Card className="p-6 border-white/5 bg-slate-900/20 border-dashed opacity-70 hover:opacity-100 transition-opacity flex items-start gap-4 cursor-not-allowed">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Semantic AI Search Results</h4>
            <p className="text-sm text-slate-400 mt-1">Review natural language search history and pinned results across your events.</p>
          </div>
        </Card>

        <Card className="p-6 border-white/5 bg-slate-900/20 border-dashed opacity-70 hover:opacity-100 transition-opacity flex items-start gap-4 cursor-not-allowed">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Face Recognition Hub</h4>
            <p className="text-sm text-slate-400 mt-1">Find all photos of yourself instantly across public and private events.</p>
          </div>
        </Card>

        <Card className="p-6 border-white/5 bg-slate-900/20 border-dashed opacity-70 hover:opacity-100 transition-opacity flex items-start gap-4 cursor-not-allowed">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Activity Feed</h4>
            <p className="text-sm text-slate-400 mt-1">A timeline of your recent interactions, likes, comments, and uploads.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
