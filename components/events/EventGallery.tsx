'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, XCircle, Inbox, AlertCircle, RefreshCw, ScanFace, Sparkles, Filter, ChevronDown } from 'lucide-react';
import { EventWithProfile } from '@/lib/actions/events';
import EventCard from './EventCard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface EventGalleryProps {
  initialEvents: EventWithProfile[];
  errorMsg?: string;
}

export default function EventGallery({ initialEvents = [], errorMsg }: EventGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'media'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compute dynamic category list based on existing database values
  const categories = useMemo(() => {
    const list = new Set<string>();
    initialEvents.forEach((e) => {
      if (e.category) {
        list.add(e.category);
      }
    });
    return ['all', ...Array.from(list)];
  }, [initialEvents]);

  // Instant local filtering & sorting using useMemo to maximize performance
  const filteredEvents = useMemo(() => {
    let result = [...initialEvents];

    // Filter by Smart Search simulation
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          (e.description && e.description.toLowerCase().includes(term)) ||
          (e.category && e.category.toLowerCase().includes(term))
      );
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(
        (e) => e.category && e.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Visibility
    if (selectedVisibility !== 'all') {
      const targetPublic = selectedVisibility === 'public';
      result = result.filter((e) => e.is_public === targetPublic);
    }

    // Quick Filters logic
    if (activeQuickFilter === 'Trending') {
      // Mock logic: Sort by members (since we don't have true 'trending' without time-series data)
      result.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    } else if (activeQuickFilter === 'Most Photos') {
      result.sort((a, b) => (b.mediaCount || 0) - (a.mediaCount || 0));
    } else if (activeQuickFilter === 'Public Events') {
      result = result.filter(e => e.is_public);
    }

    // Standard Sort
    if (!activeQuickFilter) {
      result.sort((a, b) => {
        if (sortBy === 'popular') return (b.memberCount || 0) - (a.memberCount || 0);
        if (sortBy === 'media') return (b.mediaCount || 0) - (a.mediaCount || 0);
        
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }

    return result;
  }, [initialEvents, searchTerm, selectedCategory, selectedVisibility, sortBy, activeQuickFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setSelectedCategory('all');
    setSelectedVisibility('all');
    setActiveQuickFilter(null);
  };

  const quickFilters = ['Trending', 'Popular', 'Recently Added', 'Most Photos', 'Public Events'];

  if (errorMsg) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-red-50/50 border border-red-100 rounded-3xl text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Events</h3>
        <p className="text-sm text-red-700 mb-6">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-8" aria-label="Smart Discovery Panel">
      
      {/* Premium Smart Search Dashboard */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-200/20 space-y-6">
        
        {/* Top Row: AI Search Bar and Find Photos */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Sparkles className="w-5 h-5 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder='Smart Search: Try "Show me cultural events"'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 hover:border-indigo-300 focus:border-indigo-600 focus:bg-white rounded-2xl text-base text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-indigo-600/10 shadow-inner"
            />
          </div>

          <Link href="/my-photos" className="shrink-0 h-full">
            <button className="h-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 w-full lg:w-auto">
              <ScanFace className="w-5 h-5" />
              Find Photos of Me
            </button>
          </Link>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Quick Filters:</span>
          {quickFilters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveQuickFilter(activeQuickFilter === filter ? null : filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeQuickFilter === filter 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Advanced Filters
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters (Expandable) */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">All Categories</option>
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Visibility</label>
                  <select
                    value={selectedVisibility}
                    onChange={(e) => setSelectedVisibility(e.target.value as 'all' | 'public' | 'private')}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">Any Visibility</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular' | 'media')}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
                  >
                    <option value="newest">Recently Added</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Members</option>
                    <option value="media">Most Media</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count & Clear */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span aria-live="polite">
              <strong>{filteredEvents.length}</strong> events found
            </span>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedVisibility !== 'all' || sortBy !== 'newest' || activeQuickFilter) && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Empty State */}
      {initialEvents.length === 0 ? (
        <div className="w-full max-w-lg mx-auto my-16 text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Events Yet</h3>
          <p className="text-base text-slate-500 mb-8 leading-relaxed">
            The platform is empty. Be the first to create an amazing event and start building the community!
          </p>
          <Link href="/events/create">
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
              Create First Event
            </button>
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-slate-800 mb-2">No AI Matches Found</h4>
          <p className="text-base text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            We couldn&apos;t find any events matching your smart search criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Event Grid with layout animations */
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}

// Skeleton loading state
export function EventGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-[420px] animate-pulse">
          <div className="h-48 w-full bg-slate-200" />
          <div className="p-6 flex-1 space-y-4">
            <div className="flex justify-between"><div className="h-5 w-20 bg-slate-200 rounded-full" /><div className="h-5 w-24 bg-slate-200 rounded-full" /></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
            <div className="space-y-2"><div className="h-4 w-full bg-slate-200 rounded-md" /><div className="h-4 w-5/6 bg-slate-200 rounded-md" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
