/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Cell 
} from 'recharts';
import { Camera, Heart, Eye, HardDrive, Sparkles, User, Video, Image as ImageIcon } from 'lucide-react';

interface AnalyticsDashboardProps {
  mediaItems: any[];
}

export default function AnalyticsDashboard({ mediaItems }: AnalyticsDashboardProps) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  // --- Data Processing ---
  const stats = useMemo(() => {
    let images = 0;
    let videos = 0;
    let totalViews = 0;
    let totalEngagement = 0;
    let totalSize = 0;

    mediaItems.forEach(m => {
      if (m.media_type === 'video') videos++;
      else images++;

      totalViews += (m.views_count || 0) + (m.downloads_count || 0);
      
      const likesCount = m.likes?.[0]?.count || 0;
      const commentsCount = m.comments?.[0]?.count || 0;
      totalEngagement += likesCount + commentsCount + (m.shares_count || 0);
      
      totalSize += m.file_size || 0;
    });

    return {
      images,
      videos,
      totalViews,
      totalEngagement,
      totalSize: formatBytes(totalSize)
    };
  }, [mediaItems]);

  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    mediaItems.forEach(m => {
      if (m.mood) {
        counts[m.mood] = (counts[m.mood] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([subject, fullMark]) => ({ subject, fullMark }))
      .sort((a, b) => b.fullMark - a.fullMark)
      .slice(0, 6); // Max 6 for a clean radar
  }, [mediaItems]);

  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    mediaItems.forEach(m => {
      if (m.ai_tags && Array.isArray(m.ai_tags)) {
        m.ai_tags.forEach((tag: string) => {
          if (typeof tag === 'string') {
            counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] || 0) + 1;
          }
        });
      } else if (m.ai_tags && typeof m.ai_tags === 'string') {
        m.ai_tags.split(',').forEach((tag: string) => {
           const trimmed = tag.trim().toLowerCase();
           if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);
  }, [mediaItems]);

  const timelineData = useMemo(() => {
    const timeMap: Record<string, { name: string; uploads: number; engagement: number }> = {};
    
    // Sort items chronologically first
    const sorted = [...mediaItems].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach(m => {
      const date = new Date(m.created_at);
      const label = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
      
      if (!timeMap[label]) {
        timeMap[label] = { name: label, uploads: 0, engagement: 0 };
      }
      timeMap[label].uploads += 1;
      
      const engagement = (m.views_count || 0) + (m.likes?.[0]?.count || 0) + (m.comments?.[0]?.count || 0);
      timeMap[label].engagement += engagement;
    });

    return Object.values(timeMap);
  }, [mediaItems]);

  const topContributors = useMemo(() => {
    const users: Record<string, { id: string; name: string; count: number; engagement: number }> = {};
    
    mediaItems.forEach(m => {
      const userId = m.uploaded_by;
      if (!userId) return;
      
      if (!users[userId]) {
        users[userId] = { id: userId, name: m.profiles?.full_name || 'Anonymous', count: 0, engagement: 0 };
      }
      
      users[userId].count += 1;
      const engagement = (m.likes?.[0]?.count || 0) + (m.comments?.[0]?.count || 0) + (m.shares_count || 0);
      users[userId].engagement += engagement;
    });

    return Object.values(users)
      .sort((a, b) => b.count - a.count || b.engagement - a.engagement)
      .slice(0, 5);
  }, [mediaItems]);

  const colorPalette = useMemo(() => {
    const colorCounts: Record<string, number> = {};
    mediaItems.forEach(m => {
      if (m.dominant_colors && Array.isArray(m.dominant_colors)) {
        m.dominant_colors.forEach((color: string) => {
          // ensure valid hex
          if (color.startsWith('#')) {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mediaItems]);

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
        <Sparkles className="w-10 h-10 text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300">No Analytics Yet</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-2">Upload some media to see AI insights, mood tracking, and engagement metrics!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-900/10 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div>
            <p className="text-indigo-400 text-sm font-medium mb-1">Total Media</p>
            <h3 className="text-3xl font-bold text-white">{mediaItems.length}</h3>
            <div className="flex gap-3 mt-2 text-xs text-indigo-300/70 font-medium">
              <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {stats.images}</span>
              <span className="flex items-center gap-1"><Video className="w-3 h-3"/> {stats.videos}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/10 to-pink-900/10 border border-pink-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div>
            <p className="text-pink-400 text-sm font-medium mb-1">Total Engagement</p>
            <h3 className="text-3xl font-bold text-white">{stats.totalEngagement}</h3>
            <p className="text-xs text-pink-300/70 mt-2 font-medium">Likes, Comments & Shares</p>
          </div>
          <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div>
            <p className="text-emerald-400 text-sm font-medium mb-1">Total Views</p>
            <h3 className="text-3xl font-bold text-white">{stats.totalViews}</h3>
            <p className="text-xs text-emerald-300/70 mt-2 font-medium">Includes Downloads</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg backdrop-blur-sm">
          <div>
            <p className="text-amber-400 text-sm font-medium mb-1">Total Storage</p>
            <h3 className="text-3xl font-bold text-white">{stats.totalSize}</h3>
            <p className="text-xs text-amber-300/70 mt-2 font-medium">Cloud Capacity Used</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Timeline & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Area Chart */}
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-200">Activity Over Time</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Uploads</span>
              <span className="flex items-center gap-1 text-pink-400"><div className="w-2 h-2 rounded-full bg-pink-500"></div> Engagement</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="uploads" name="Uploads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUploads)" />
                <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vibe Radar */}
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col">
          <h3 className="text-base font-semibold text-slate-200 mb-2">Event Vibe</h3>
          <p className="text-xs text-slate-400 mb-4">AI detected mood distribution</p>
          
          <div className="flex-1 min-h-[250px] w-full">
            {moodData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={moodData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="Vibe" dataKey="fullMark" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                Need at least 3 distinct moods detected by AI to generate the vibe radar.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Leaderboard & Content Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Contributors */}
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Top Contributors
          </h3>
          
          {topContributors.length > 0 ? (
            <div className="space-y-4">
              {topContributors.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.count} uploads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-400">{user.engagement}</p>
                    <p className="text-xs text-slate-400">interactions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-8">No contributors found yet.</div>
          )}
        </div>

        {/* AI Tag Cloud Insight */}
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col">
          <h3 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Discovery Tags
          </h3>
          <p className="text-xs text-slate-400 mb-6">Most common elements detected by AI</p>
          
          <div className="flex-1 w-full min-h-[250px] flex flex-wrap content-start gap-2.5">
            {tagData.length > 0 ? (
              tagData.map((tag, idx) => {
                const maxCount = tagData[0].count;
                const ratio = tag.count / maxCount;
                
                let sizeClass = "text-xs px-2.5 py-1";
                let bgClass = "bg-slate-800/40";
                
                if (ratio > 0.8) {
                  sizeClass = "text-xl font-bold px-4 py-2";
                  bgClass = "bg-slate-800/90 shadow-md";
                } else if (ratio > 0.5) {
                  sizeClass = "text-base font-semibold px-3 py-1.5";
                  bgClass = "bg-slate-800/70 shadow-sm";
                } else if (ratio > 0.3) {
                  sizeClass = "text-sm font-medium px-3 py-1";
                  bgClass = "bg-slate-800/60";
                }

                const color = COLORS[idx % COLORS.length];
                
                return (
                  <span 
                    key={tag.name} 
                    className={`inline-flex items-center justify-center rounded-xl border border-white/5 transition-all hover:scale-110 hover:z-10 cursor-default backdrop-blur-sm ${sizeClass} ${bgClass}`}
                    style={{ color: color }}
                    title={`${tag.name} (${tag.count} occurences)`}
                  >
                    #{tag.name.replace(/\s+/g, '')}
                  </span>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500">
                <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                No AI tags discovered yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Color Palette */}
      {colorPalette.length > 0 && (
        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-xl overflow-hidden relative">
          <h3 className="text-base font-semibold text-slate-200 mb-4 relative z-10">Event Color Palette</h3>
          <div className="flex h-16 w-full rounded-xl overflow-hidden relative z-10 shadow-inner">
            {colorPalette.map((item, idx) => (
              <div 
                key={idx} 
                style={{ backgroundColor: item.color, width: `${(item.count / colorPalette[0].count) * 100}%`, minWidth: '4%' }}
                className="h-full flex items-center justify-center group relative transition-all duration-300 hover:min-w-[10%] hover:scale-105 origin-center z-10"
                title={`${item.color} (${item.count})`}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-md absolute pointer-events-none drop-shadow-md">
                  {item.color}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Helper to format bytes
function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
