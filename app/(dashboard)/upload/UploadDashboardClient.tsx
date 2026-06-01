'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Shield, Settings, Info, Tag } from 'lucide-react';
import UploadDropzone from '@/components/upload/UploadDropzone';

interface EventData {
  id: string;
  name: string;
  event_date: string | null;
}

export default function UploadDashboardClient({ initialEvents }: { initialEvents: EventData[] }) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader 
        title="Media Upload Center"
        subtitle="Securely upload, process, and attach media to campus events."
        align="left"
        badge={<Badge variant="gradient">Production Grade</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Settings */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-6 border-white/5">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Upload Settings
            </div>

            {/* Event Selection */}
            <div className="space-y-2">
              <label htmlFor="event-select" className="text-sm font-semibold text-slate-300">
                Target Event <span className="text-rose-500">*</span>
              </label>
              <select
                id="event-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm font-medium text-slate-200 outline-none transition-all"
              >
                <option value="" disabled>-- Select an Event --</option>
                {initialEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} {evt.event_date ? `(${new Date(evt.event_date).toLocaleDateString('en-US')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Media Visibility
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    !isPrivate 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    isPrivate 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Private
                </button>
              </div>
              <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                {isPrivate 
                  ? 'Only visible to authenticated members and admins. AI training is opted-out.' 
                  : 'Visible to anyone with access to the event gallery. Eligible for global AI discovery.'}
              </p>
            </div>

            {/* Future AI Tags Placeholder */}
            <div className="space-y-2 pt-4 border-t border-white/5 opacity-50 pointer-events-none">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                Auto-Tagging Rules (Coming Soon)
              </label>
              <input 
                type="text" 
                placeholder="e.g., 'Graduation', 'Stage'" 
                disabled
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-500"
              />
            </div>

          </Card>
        </div>

        {/* Right Area: Dropzone & Queue */}
        <div className="lg:col-span-8 space-y-6">
          <UploadDropzone 
            eventId={selectedEvent} 
            isPrivate={isPrivate} 
            onUploadComplete={() => {
              // Can trigger a local toast or refresh a recent uploads list
            }}
          />

          <Card className="p-6 border-white/5 bg-slate-900/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl shrink-0">
                <Info className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Architecture Note</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Uploads are handled directly via Cloudinary&apos;s secure signed infrastructure to bypass standard Next.js Vercel payload limits (4.5MB).
                  Files are stored on global CDNs, transformed on-the-fly, and automatically trigger our Supabase Server Actions for strict PostgreSQL metadata tracking.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
