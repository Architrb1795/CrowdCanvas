'use client';

import React, { useEffect, useState } from 'react';
import MediaGallery, { type MediaItem } from '@/components/media/MediaGallery';
import { Tag, Loader2 } from 'lucide-react';
import MediaLightbox from '@/components/media/MediaLightbox';

export default function PhotosOfMePage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPhotosOfMe() {
      try {
        const res = await fetch('/api/social/photos-of-me');
        if (res.ok) {
          const data = await res.json();
          setMediaItems(data.media || []);
        }
      } catch (e) {
        console.error('Failed to fetch photos of me', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPhotosOfMe();
  }, []);

  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col pt-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Tag className="w-6 h-6 text-blue-500" />
            Photos of Me
          </h1>
          <p className="text-slate-400 mt-1">Photos you are tagged in and facial recognition matches.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/30 border border-white/5 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No photos found</h3>
          <p className="text-slate-400 max-w-sm">
            When friends tag you in photos or our AI recognizes you, they will appear here.
          </p>
        </div>
      ) : (
        <MediaGallery
          initialMedia={mediaItems}
        />
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          mediaList={mediaItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
