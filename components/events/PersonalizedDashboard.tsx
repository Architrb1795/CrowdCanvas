'use client';

import React from 'react';
import { ScanFace, User, Image as ImageIcon, Calendar } from 'lucide-react';
import Link from 'next/link';

interface PersonalizedDashboardProps {
  userName?: string;
  facesFound?: number;
  eventsJoined?: number;
  mediaUploaded?: number;
}

export default function PersonalizedDashboard({ 
  userName = 'Archit', 
  facesFound = 0,
  eventsJoined = 0,
  mediaUploaded = 0
}: PersonalizedDashboardProps) {
  return (
    <section className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm my-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {userName} 👋
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Here is a quick overview of your CrowdCanvas activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Face Match Card */}
        <Link href="/my-photos" className="group block">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 h-full transition-all hover:-translate-y-1 hover:shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white">
                <ScanFace className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider bg-black/20 px-2 py-1 rounded-md">New Matches</div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-white mb-1">{facesFound}</div>
              <div className="text-sm font-medium text-indigo-100">Photos of you found</div>
            </div>
          </div>
        </Link>

        {/* My Events */}
        <Link href="#" className="group block">
          <div className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 h-full transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-1">{eventsJoined}</div>
              <div className="text-sm font-medium text-slate-500">Events Joined</div>
            </div>
          </div>
        </Link>

        {/* My Uploads */}
        <Link href="#" className="group block">
          <div className="bg-slate-50 border border-slate-200 hover:border-pink-300 rounded-2xl p-5 h-full transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-1">{mediaUploaded}</div>
              <div className="text-sm font-medium text-slate-500">Media Uploaded</div>
            </div>
          </div>
        </Link>

        {/* My Profile */}
        <Link href="/profile" className="group block">
          <div className="bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-2xl p-5 h-full transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-1">Profile</div>
              <div className="text-sm font-medium text-slate-500">Manage Account</div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
