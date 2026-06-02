'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Check, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TagData {
  id: string;
  x_coordinate: number;
  y_coordinate: number;
  status: string;
  tagged_user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface PhotoTaggingOverlayProps {
  mediaId: string;
  isTaggingMode: boolean;
  onTaggingComplete: () => void;
  currentUserId: string | null;
}

export default function PhotoTaggingOverlay({ 
  mediaId, 
  isTaggingMode, 
  onTaggingComplete,
  currentUserId
}: PhotoTaggingOverlayProps) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [pendingTag, setPendingTag] = useState<{ x: number, y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; avatar_url: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/social/tag?mediaId=${mediaId}`);
      if (res.ok) {
        const data = await res.json();
        // Only show approved tags or tags created by/for the current user
        const visibleTags = data.tags.filter((t: { status: string; tagged_user_id: string; tagged_by_user_id: string }) => 
          t.status === 'approved' || 
          t.tagged_user_id === currentUserId || 
          t.tagged_by_user_id === currentUserId
        );
        setTags(visibleTags);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    if (!searchQuery) {
      // eslint-disable-next-line
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(5);
      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase]);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isTaggingMode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPendingTag({ x, y });
    setSearchQuery('');
    setSearchResults([]);
  };

  const submitTag = async (userId: string) => {
    if (!pendingTag) return;
    try {
      const res = await fetch('/api/social/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          taggedUserId: userId,
          xCoordinate: pendingTag.x,
          yCoordinate: pendingTag.y
        })
      });
      if (res.ok) {
        await fetchTags();
        setPendingTag(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-10 transition-colors duration-300 ${isTaggingMode ? 'cursor-crosshair bg-black/10' : ''}`}
      onClick={handleImageClick}
    >
      {/* Helper Banner for Tagging Mode */}
      <AnimatePresence>
        {isTaggingMode && !pendingTag && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-sm font-medium text-white shadow-sm">Tap anywhere on a face to tag</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Tags */}
      <AnimatePresence>
        {!isTaggingMode && tags.map(tag => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute group z-10"
            style={{ left: `${tag.x_coordinate}%`, top: `${tag.y_coordinate}%` }}
          >
            <div className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              {/* Tag Anchor Point */}
              <div className="w-5 h-5 rounded-full bg-black/40 border-[1.5px] border-white/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100 origin-top">
                <div className="bg-slate-900/95 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/10 shadow-2xl flex items-center gap-2.5 whitespace-nowrap">
                  {tag.tagged_user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tag.tagged_user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-white/10">
                      <span className="text-[10px] font-bold text-indigo-300">
                        {tag.tagged_user.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white tracking-wide">{tag.tagged_user.full_name}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Pending Tag Popover */}
      <AnimatePresence>
        {isTaggingMode && pendingTag && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="absolute mb-6 z-30 w-72"
            // Use clamp logic so the popover doesn't go off-screen easily
            style={{ 
              left: `clamp(10%, ${pendingTag.x}%, 90%)`, 
              top: `${pendingTag.y}%`,
              transform: 'translate(-50%, -100%)' 
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-black/50 flex flex-col">
              {/* Search Header */}
              <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Who is this?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-white w-full placeholder:text-slate-500"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setPendingTag(null);
                    setSearchQuery('');
                  }} 
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {/* Results List */}
              <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {isSearching ? (
                  <div className="p-4 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-1.5 flex flex-col gap-0.5">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => submitTag(user.id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-indigo-500/20 rounded-xl transition-all text-left group"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-300">
                                {user.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{user.full_name}</span>
                        <Check className="w-4 h-4 text-indigo-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-300 font-medium mb-1">No users found</p>
                    <p className="text-xs text-slate-500">Try a different name</p>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-400 font-medium">Type a name to search</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pointer triangle */}
            <div className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-5 h-5 rotate-45 bg-slate-900/95 border-r border-b border-white/15" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Reticle for Tagging Mode */}
      {isTaggingMode && pendingTag && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
        >
          <div className="relative flex items-center justify-center">
            {/* Camera focus bracket corners */}
            <div className="absolute w-12 h-12 border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-sm" style={{ clipPath: 'polygon(0 0, 25% 0, 25% 10%, 10% 10%, 10% 25%, 0 25%, 0 75%, 10% 75%, 10% 90%, 25% 90%, 25% 100%, 0 100%, 100% 100%, 100% 75%, 90% 75%, 90% 90%, 75% 90%, 75% 100%, 100% 100%, 100% 0, 75% 0, 75% 10%, 90% 10%, 90% 25%, 100% 25%)' }} />
            {/* Center dot */}
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
          </div>
        </div>
      )}
    </div>
  );
}
