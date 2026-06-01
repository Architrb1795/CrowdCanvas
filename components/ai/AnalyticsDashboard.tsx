/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface AnalyticsDashboardProps {
  mediaItems: any[];
}

export default function AnalyticsDashboard({ mediaItems }: AnalyticsDashboardProps) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    mediaItems.forEach(m => {
      if (m.mood) {
        counts[m.mood] = (counts[m.mood] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [mediaItems]);

  const sceneData = useMemo(() => {
    const counts: Record<string, number> = {};
    mediaItems.forEach(m => {
      if (m.scene_type) {
        counts[m.scene_type] = (counts[m.scene_type] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [mediaItems]);

  const timelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    mediaItems.forEach(m => {
      const date = new Date(m.created_at);
      const hour = date.getHours();
      const label = `${hour}:00`;
      counts[label] = (counts[label] || 0) + 1;
    });
    // Sort by hour
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [mediaItems]);

  if (mediaItems.length === 0) {
    return <div className="text-slate-500 text-sm">No media available for analytics.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Mood Distribution</h3>
        {moodData.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center justify-center h-48">No mood data</div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Scene Types</h3>
        {sceneData.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sceneData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center justify-center h-48">No scene data</div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Upload Activity</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
