'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Globe, Shield, Activity, Users, Image as ImageIcon, ScanFace, TrendingUp } from 'lucide-react';

interface PlatformStatsProps {
  totalCount: number;
  publicCount: number;
  privateCount: number;
  // In a real app we'd fetch these dynamically, providing fallback props for now
  totalMedia?: number;
  totalMembers?: number;
  facesIndexed?: number;
  eventsTrend?: string;
  mediaTrend?: string;
  membersTrend?: string;
  facesTrend?: string;
}

// Simple counter component with animation
const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const incrementTime = Math.max(16, duration / end);
    let timer: NodeJS.Timeout;
    
    if (end > 0) {
      const updateCounter = () => {
        start += Math.max(1, Math.floor(end / 40)); // Speed up large numbers
        if (start >= end) {
          setCount(end);
        } else {
          setCount(start);
          timer = setTimeout(updateCounter, incrementTime);
        }
      };
      updateCounter();
    }
    
    return () => clearTimeout(timer);
  }, [value]);
  
  return <>{count.toLocaleString()}</>;
};

export default function PlatformStats({ 
  totalCount, 
  publicCount, 
  privateCount,
  totalMedia = 4285,
  totalMembers = 1842,
  facesIndexed = 12450,
  eventsTrend = 'Active',
  mediaTrend = 'Active',
  membersTrend = 'Active',
  facesTrend = 'Active'
}: PlatformStatsProps) {
  
  const stats = [
    { label: 'Total Events', value: totalCount, icon: CalendarRange, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', trend: eventsTrend },
    { label: 'Media Uploaded', value: totalMedia, icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', trend: mediaTrend },
    { label: 'Active Members', value: totalMembers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', trend: membersTrend },
    { label: 'Faces Indexed', value: facesIndexed, icon: ScanFace, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', trend: facesTrend },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20" aria-label="Live Platform Statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
              className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-slate-200/65 flex flex-col hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
