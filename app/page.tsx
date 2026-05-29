'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { 
  Sparkles, Calendar, UploadCloud, Users, 
  Search, Shield, Zap, ArrowRight, CheckCircle2 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen pt-20 overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 max-w-4xl mx-auto"
        >
          <Badge variant="gradient" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Introducing CrowdCanvas 2.0
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Capture Every Moment. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
              Find Every Memory.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI-powered event and media management for clubs, photographers, and communities. Stop losing photos in chaotic group chats.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/events">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Explore Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero floating mock cards */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-2 shadow-2xl shadow-indigo-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
            <div className="aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-white/5 relative grid grid-cols-3 gap-4 p-4">
               {/* Mock UI inside the hero display */}
               <div className="col-span-1 space-y-4">
                 <div className="h-8 w-1/2 bg-slate-800 rounded-md"></div>
                 <div className="h-24 w-full bg-slate-800 rounded-xl"></div>
                 <div className="h-24 w-full bg-slate-800 rounded-xl"></div>
               </div>
               <div className="col-span-2 space-y-4">
                 <div className="h-8 w-1/4 bg-slate-800 rounded-md"></div>
                 <div className="h-52 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-white/5"></div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: FEATURE SHOWCASE */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <SectionHeader 
          title="Everything you need to run your community"
          subtitle="Built for scale, speed, and beautiful experiences. Leave the legacy tools behind."
          badge={<Badge variant="outline">Features</Badge>}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <FeatureCard 
            icon={Calendar} 
            title="Event Management" 
            description="Create public or private events, track RSVPs, and manage schedules all in one centralized hub."
            delay={0.1}
          />
          <FeatureCard 
            icon={UploadCloud} 
            title="Cloud Media Storage" 
            description="High-resolution photo and video hosting backed by robust infrastructure. Never run out of space."
            delay={0.2}
          />
          <FeatureCard 
            icon={Sparkles} 
            title="AI Tagging" 
            description="Automatically categorize uploads using advanced vision models to save hours of manual sorting."
            delay={0.3}
          />
          <FeatureCard 
            icon={Users} 
            title="Face Recognition" 
            description="Find yourself in thousands of photos instantly with opt-in facial recognition and privacy controls."
            delay={0.4}
          />
          <FeatureCard 
            icon={Search} 
            title="Smart Search" 
            description="Search for 'red shirt', 'dancing', or 'hackathon winner' and get exact visual matches."
            delay={0.5}
          />
          <FeatureCard 
            icon={Shield} 
            title="Realtime Access Control" 
            description="Granular permissions. Decide exactly who can view, upload, or manage specific albums."
            delay={0.6}
          />
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (Timeline) */}
      <section className="py-24 bg-slate-900/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <SectionHeader 
            title="From chaos to curated in minutes"
            align="center"
            className="mb-16"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-6 left-12 right-12 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            {[
              { step: '01', title: 'Create Event', desc: 'Set up your campus or club event in seconds.' },
              { step: '02', title: 'Upload Media', desc: 'Photographers and guests drop their high-res shots.' },
              { step: '03', title: 'AI Organizes', desc: 'Our engine tags, sorts, and enhances everything.' },
              { step: '04', title: 'Share & Discover', desc: 'Members find their memories instantly.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold z-10 shadow-lg shadow-indigo-500/10">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-white">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: AI SHOWCASE */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <Badge variant="gradient">Powered by AI</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Stop scrolling.<br/>Start finding.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Our vision engine automatically tags every uploaded photo. Instead of digging through folders named &quot;IMG_4920&quot;, just search for what you remember.
            </p>
            <ul className="space-y-4 pt-4">
              {['Semantic search for objects and scenes', 'Opt-in facial recognition matching', 'Automatic quality sorting and deduplication'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative h-[400px] rounded-2xl bg-slate-900 border border-white/10 overflow-hidden p-6 flex flex-col">
            <div className="w-full bg-slate-950 rounded-xl p-3 border border-white/5 flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-slate-400" />
              <div className="flex-1 text-slate-300 font-mono text-sm">&quot;Hackathon winner blue shirt&quot;</div>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-indigo-500/20 rounded-xl border border-indigo-500/30 animate-pulse"></div>
              <div className="bg-slate-800 rounded-xl border border-white/5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: GALLERY PREVIEW */}
      <section className="py-24 overflow-hidden relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">A visual home for your community</h2>
        </div>
        {/* Fake masonry layout scrolling horizontally */}
        <div className="flex gap-4 px-4 overflow-hidden opacity-50 hover:opacity-100 transition-opacity duration-500">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`flex-shrink-0 w-64 md:w-80 rounded-2xl overflow-hidden bg-slate-800 ${i % 2 === 0 ? 'h-64' : 'h-80'}`}>
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: STATISTICS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Events Hosted', val: '500+' },
            { label: 'Photos Managed', val: '2.5M' },
            { label: 'Active Members', val: '15k' },
            { label: 'Storage Saved', val: '10TB' }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black text-white">{stat.val}</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: TESTIMONIALS */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Trusted by campus leaders" className="mb-16" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "It transformed how we handle our annual cultural fest media. No more begging for GDrive links.", author: "Sarah J.", role: "Club President" },
              { quote: "As a photographer, having a centralized place to drop high-res shots where the AI tags faces is a lifesaver.", author: "Mike T.", role: "Lead Photographer" },
              { quote: "The UI feels like a premium Silicon Valley product. Our members absolutely love interacting with the galleries.", author: "Priya R.", role: "Event Organizer" }
            ].map((t, i) => (
              <Card key={i} className="p-6 space-y-4">
                <p className="text-slate-300 italic leading-relaxed">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.author}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-xl font-bold text-white">CrowdCanvas</span>
            </Link>
            <p className="text-sm text-slate-400">The definitive platform for community memories.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/events" className="hover:text-indigo-400">Events</Link></li>
              <li><Link href="/events" className="hover:text-indigo-400">Galleries</Link></li>
              <li><Link href="/" className="hover:text-indigo-400">AI Search</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-indigo-400">Documentation</Link></li>
              <li><Link href="/" className="hover:text-indigo-400">Help Center</Link></li>
              <li><Link href="/" className="hover:text-indigo-400">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} CrowdCanvas. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
