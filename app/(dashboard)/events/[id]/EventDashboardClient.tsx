/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import MediaGalleryGrid from '@/components/media/MediaGalleryGrid';
import AnalyticsDashboard from '@/components/ai/AnalyticsDashboard';
import { Calendar, Settings, Share2, Users, MapPin, Image as ImageIcon, Sparkles, BarChart3, Clock, LayoutGrid, Loader2, PlayCircle, Lock, Globe, AlertCircle, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import RequestAccessButton from '@/components/events/RequestAccessButton';

// Custom tabs if generic UI doesn't exist
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

interface EventDashboardClientProps {
   
  event: any;
   
  mediaItems: any[];
  canManageEvent: boolean;
  canUpload?: boolean;
  hasPendingRequest?: boolean;
  currentUserId?: string;
  watermarkedDownloadsCount?: number;
}

export default function EventDashboardClient({ 
  event, 
  mediaItems, 
  canManageEvent,
  canUpload = false,
  hasPendingRequest = false,
  currentUserId,
  watermarkedDownloadsCount = 0
}: EventDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('gallery');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/event-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setErrorDialog(errorData?.error || 'Failed to generate insights');
        setIsGenerating(false);
        return;
      }
      
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorDialog(err.message || 'Failed to generate insights. Check console.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasInsights = event.ai_summary || event.ai_highlights?.length > 0;

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{event.name}</h1>
          <p className="text-slate-400">{event.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-3">
          {!canUpload ? (
            <RequestAccessButton eventId={event.id} hasPending={hasPendingRequest} />
          ) : (
            <Link 
              href={`/upload`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </Link>
          )}
          {canManageEvent && (
            <Link 
              href={`/events/${event.id}/settings`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
          )}
          {canManageEvent && (
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {hasInsights ? 'Regenerate Insights' : 'Generate AI Insights'}
            </button>
          )}
        </div>
      </div>

      {errorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
            <div className="flex gap-4 items-start mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Action Failed</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{errorDialog}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorDialog(null)}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <TabButton active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={ImageIcon} label="Gallery" />
        <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={Sparkles} label="AI Insights" />
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} label="Analytics" />
      </div>

      {activeTab === 'gallery' && (
        <div className="animate-in fade-in duration-300">
          <MediaGalleryGrid 
            mediaItems={mediaItems} 
            canManageEvent={canManageEvent} 
            currentUserId={currentUserId}
          />
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="animate-in fade-in duration-300 space-y-8">
          {!hasInsights ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <Sparkles className="w-12 h-12 mx-auto text-indigo-500/50 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Insights Yet</h3>
              <p className="text-slate-400 mb-6">Generate AI insights to automatically summarize the event, pick highlights, and build a timeline.</p>
              {canManageEvent && (
                <button
                  onClick={handleGenerateInsights}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                >
                  {isGenerating ? 'Analyzing...' : 'Generate Now'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Event Summary */}
              {event.ai_summary && (
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center gap-2 relative z-10">
                    <Sparkles className="w-5 h-5" /> AI Event Summary
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed relative z-10">{event.ai_summary}</p>
                </div>
              )}

              {/* Story Timeline */}
              {event.event_story && event.event_story.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Event Timeline</h2>
                  <div className="space-y-6">
                    {event.event_story.map((item: any, index: number) => {
                      const media = mediaItems.find((m: any) => m.id === item.mediaId);
                      return (
                        <div key={index} className="flex gap-6 items-start">
                          <div className="w-32 shrink-0 pt-2 text-right">
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{item.timeLabel}</span>
                          </div>
                          <div className="relative flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-950 z-10"></div>
                            {index !== event.event_story.length - 1 && (
                              <div className="w-px h-full bg-slate-800 absolute top-4 left-2 -translate-x-1/2 mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex gap-4 items-center">
                            {media && (
                              <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-950">
                                <img src={media.thumbnail_url || media.file_url} className="w-full h-full object-cover" alt="Timeline" />
                              </div>
                            )}
                            <p className="text-slate-300 text-sm leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {event.ai_highlights && event.ai_highlights.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-400" /> Best Moments
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {event.ai_highlights.map((id: string) => {
                      const m = mediaItems.find((m: any) => m.id === id);
                      if (!m) return null;
                      return (
                        <div key={id} className="aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-800 relative group">
                          <img src={m.thumbnail_url || m.file_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Highlight" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Regenerate Event Insights Button */}
              {canManageEvent && (
                <div className="mt-12 pt-8 border-t border-slate-800/50 flex justify-center pb-8">
                  <button
                    onClick={handleGenerateInsights}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors border border-slate-700 shadow-lg"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isGenerating ? 'Updating Insights...' : 'Regenerate Event Insights'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-in fade-in duration-300">
          <AnalyticsDashboard mediaItems={mediaItems} watermarkedDownloadsCount={watermarkedDownloadsCount} />
        </div>
      )}
    </div>
  );
}
