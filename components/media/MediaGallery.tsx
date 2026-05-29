'use client';

import React, { useState } from 'react';
import MediaCard from './MediaCard';
import MediaLightbox from './MediaLightbox';
import { Search } from 'lucide-react';

export interface MediaItem {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  cloudinary_public_id: string | null;
  media_type: 'photo' | 'video';
  width: number | null;
  height: number | null;
  created_at: string;
  uploader?: { full_name: string; avatar_url: string };
  event?: { name: string };
  ai_tags?: string[];
}

interface MediaGalleryProps {
  initialMedia: MediaItem[];
}

export default function MediaGallery({ initialMedia }: MediaGalleryProps) {
  const [media] = useState<MediaItem[]>(initialMedia);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  
  // Future state for search/filtering
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedia = media.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // Search tags, event names, or uploader
    return (
      (m.ai_tags && m.ai_tags.some(tag => tag.toLowerCase().includes(query))) ||
      (m.event?.name.toLowerCase().includes(query)) ||
      (m.uploader?.full_name.toLowerCase().includes(query))
    );
  });

  if (initialMedia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Media Found</h3>
        <p className="text-slate-400 max-w-sm">No photos or videos have been uploaded yet. Head over to the Upload Dashboard to add memories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Search Bar (AI Prep) */}
      <div className="relative max-w-xl mx-auto mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search by event, uploader, or AI tags (e.g. 'Graduation', 'Blue shirt')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Pinterest-style Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredMedia.map((item, idx) => (
          <MediaCard 
            key={item.id} 
            item={item} 
            onClick={() => setSelectedMediaIndex(idx)} 
          />
        ))}
      </div>

      {filteredMedia.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-slate-400">No media matches &quot;{searchQuery}&quot;</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMediaIndex !== null && (
        <MediaLightbox 
          mediaList={filteredMedia}
          initialIndex={selectedMediaIndex}
          onClose={() => setSelectedMediaIndex(null)}
        />
      )}
    </div>
  );
}
