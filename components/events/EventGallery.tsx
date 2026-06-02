'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, XCircle, Inbox, AlertCircle, RefreshCw, ScanFace } from 'lucide-react';
import { EventWithProfile } from '@/lib/actions/events';
import EventCard from './EventCard';
import Link from 'next/link';

interface EventGalleryProps {
  initialEvents: EventWithProfile[];
  errorMsg?: string;
}

export default function EventGallery({ initialEvents = [], errorMsg }: EventGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'public' | 'private'>('all');

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

    // Filter by name search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          (e.description && e.description.toLowerCase().includes(term))
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

    // Sort Events
    result.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (sortBy === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return result;
  }, [initialEvents, searchTerm, selectedCategory, selectedVisibility, sortBy]);

  // Reset helper
  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setSelectedCategory('all');
    setSelectedVisibility('all');
  };

  // 1. Error boundary fallback UI
  if (errorMsg) {
    return (
      <div 
        className="w-full max-w-2xl mx-auto my-12 p-8 bg-red-50/50 border border-red-100 rounded-2xl text-center"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Events</h3>
        <p className="text-sm text-red-700 mb-6">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // 2. Main Empty State (No events exist at all in database)
  if (initialEvents.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto my-16 text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
        <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          There are currently no events registered. Click the &quot;Create Event&quot; button above to launch the university&apos;s first activity!
        </p>
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          Awaiting Admin Action
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8" aria-label="Event Discovery Grid">
      
      {/* Premium Filter Dashboard */}
      <nav 
        className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4"
        aria-label="Event Filters"
      >
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by event name or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-100"
              aria-label="Search events"
            />
          </div>

          <Link href="/my-photos" className="shrink-0">
            <button className="h-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
              <ScanFace className="w-4 h-4" />
              Find Photos of Me
            </button>
          </Link>

          {/* Inline Filter Selects */}
          <div className="grid grid-cols-2 sm:flex items-center gap-3">
            
            {/* Category Filter */}
            <div className="flex flex-col">
              <label htmlFor="category-select" className="sr-only">Category</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
              >
                <option value="all">All Categories</option>
                {categories
                  .filter((cat) => cat !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Visibility Filter */}
            <div className="flex flex-col">
              <label htmlFor="visibility-select" className="sr-only">Visibility</label>
              <select
                id="visibility-select"
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value as 'all' | 'public' | 'private')}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
              >
                <option value="all">All Visibility</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex flex-col">
              <label htmlFor="sort-select" className="sr-only">Sort By</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Stats & Reset Button */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span aria-live="polite">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} Found
            </span>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedVisibility !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-600 rounded-lg font-semibold transition-colors outline-none"
              aria-label="Clear active filters"
            >
              <XCircle className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </nav>

      {/* 3. Filter Empty State (no matches found) */}
      {filteredEvents.length === 0 ? (
        <div 
          className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm"
          role="status"
        >
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">No Matches Found</h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            We couldn&apos;t find any events matching &quot;{searchTerm}&quot; under your current filters. Try refining your criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            Reset Discovery filters
          </button>
        </div>
      ) : (
        /* Responsive Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Standard visual Skeleton card loader that strictly mimics
 * the size, padding, cover banner, and content layouts of EventCard.tsx
 */
export function EventGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div 
          key={i} 
          className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[380px] animate-pulse"
          aria-hidden="true"
        >
          <div className="h-32 w-full bg-slate-200"></div>
          <div className="p-6 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 rounded-md"></div>
              <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
            </div>
          </div>
          <div className="h-12 w-full bg-slate-100 border-t border-slate-200"></div>
        </div>
      ))}
    </div>
  );
}
