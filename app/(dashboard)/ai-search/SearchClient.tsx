'use client';

import React, { useState } from 'react';
import { Search, Loader2, Sparkles, FilterX } from 'lucide-react';
import Image from 'next/image';

interface SearchResult {
  id: string;
  event_id: string;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  ai_caption: string | null;
  ai_tags: string[] | null;
  similarity: number;
}

export default function SearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Advanced Filters
  const [filterMood, setFilterMood] = useState('');
  const [filterScene, setFilterScene] = useState('');
  const [filterPeopleCount, setFilterPeopleCount] = useState<number | ''>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);
    setResults([]);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          filterMood: filterMood || null,
          filterScene: filterScene || null,
          filterPeopleCount: filterPeopleCount !== '' ? Number(filterPeopleCount) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to perform AI search');
      
      setResults(data.results || []);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilterMood('');
    setFilterScene('');
    setFilterPeopleCount('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Filters</h3>
            <button 
              onClick={clearFilters}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              title="Clear Filters"
            >
              <FilterX className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Mood</label>
              <select 
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">Any Mood</option>
                <option value="celebratory">Celebratory</option>
                <option value="professional">Professional</option>
                <option value="energetic">Energetic</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Scene Type</label>
              <select 
                value={filterScene}
                onChange={(e) => setFilterScene(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">Any Scene</option>
                <option value="group photo">Group Photo</option>
                <option value="stage performance">Stage Performance</option>
                <option value="dance floor">Dance Floor</option>
                <option value="award ceremony">Award Ceremony</option>
                <option value="lecture">Lecture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">People Count</label>
              <input 
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={filterPeopleCount}
                onChange={(e) => setFilterPeopleCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Search Area */}
      <div className="flex-1 min-w-0">
        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-32 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-lg"
            placeholder="Search e.g., 'students dancing at prom'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute inset-y-2 right-2">
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="h-full px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>Search</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* Results Grid */}
        {!isSearching && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((media) => (
              <div key={media.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
                <div className="aspect-[4/3] relative bg-slate-950">
                  {media.media_type === 'video' ? (
                    <video src={media.file_url} className="w-full h-full object-cover" />
                  ) : (
                    <Image 
                      src={media.thumbnail_url || media.file_url} 
                      alt="Match"
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-mono text-indigo-300">
                    {(media.similarity * 100).toFixed(1)}% Match
                  </div>
                </div>
                {media.ai_caption && (
                  <div className="p-4">
                    <p className="text-sm text-slate-300 line-clamp-2">{media.ai_caption}</p>
                    {media.ai_tags && media.ai_tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {media.ai_tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 rounded-full text-[10px] text-slate-400 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSearching && query && results.length === 0 && !errorMsg && (
          <div className="text-center py-20 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No semantic matches found.</p>
            <p className="text-sm mt-1">Try rewording your query or loosening the filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
