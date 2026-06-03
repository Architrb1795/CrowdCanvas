'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CalendarPlus, Search, ArrowRight, Activity, Users, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import CreateEventTrigger from './CreateEventTrigger';

export default function EventHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-20 pb-24 sm:pt-28 sm:pb-32 border-b border-slate-800" aria-label="Events Dashboard Hero">
      {/* Background Gradients & Patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 top-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-purple-600 opacity-20 blur-[120px]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>CrowdCanvas AI Event Hub</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white"
          >
            Find Events. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Find Friends. <br />
              Find Yourself.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Welcome to the central intelligence of campus life. Discover new communities, browse AI-indexed media collections, and instantly locate photos of yourself using facial recognition.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <CreateEventTrigger className="w-full sm:w-auto group relative flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <CalendarPlus className="w-4.5 h-4.5" />
              Create Event
            </CreateEventTrigger>
            
            <button 
              onClick={() => document.getElementById('discovery-panel')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all"
            >
              <Search className="w-4.5 h-4.5 text-slate-400" />
              Explore Events
            </button>
          </motion.div>
        </div>

        {/* Right Animated Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative"
        >
          {/* Decorative Collage Elements */}
          <div className="relative w-full aspect-square md:aspect-video lg:aspect-square">
            
            {/* Main Floating Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-2xl z-20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">AI Face Match</div>
                  <div className="text-xs text-slate-400">Scanning recent events...</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="h-full bg-indigo-500"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Searching 12,450 photos</span>
                  <span className="text-indigo-400">2 Matches Found</span>
                </div>
              </div>
            </motion.div>

            {/* Background Floating Card 1 */}
            <motion.div 
              animate={{ y: [0, 15, 0], rotate: [-5, -2, -5] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
              className="absolute top-[10%] left-[5%] w-1/2 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-xl z-10"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-emerald-400 bg-emerald-400/10 p-1.5 rounded-lg" />
                <div>
                  <div className="text-xs text-slate-400">Live Activity</div>
                  <div className="text-sm font-semibold text-white">24 members joined</div>
                </div>
              </div>
            </motion.div>

            {/* Background Floating Card 2 */}
            <motion.div 
              animate={{ y: [0, -15, 0], rotate: [5, 8, 5] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[10%] right-[5%] w-1/2 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-xl z-10 flex items-center gap-3"
            >
              <ImageIcon className="w-8 h-8 text-amber-400 bg-amber-400/10 p-1.5 rounded-lg" />
              <div>
                <div className="text-sm font-semibold text-white">156 Photos</div>
                <div className="text-xs text-slate-400">Just uploaded</div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
