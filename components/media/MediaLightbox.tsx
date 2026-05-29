'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2, Info, Sparkles } from 'lucide-react';
import type { MediaItem } from './MediaGallery';
import { CldImage, CldVideoPlayer } from 'next-cloudinary';
import { Button } from '@/components/ui/Button';

interface MediaLightboxProps {
  mediaList: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({ mediaList, initialIndex, onClose }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showMetadata, setShowMetadata] = useState(false);

  const currentMedia = mediaList[currentIndex];

  const nextMedia = () => setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  const prevMedia = () => setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'ArrowLeft') prevMedia();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, onClose]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex bg-slate-950/95 backdrop-blur-2xl"
      >
        {/* Top Action Bar */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-slate-950 to-transparent flex items-center justify-between px-6 z-10 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="text-white font-medium text-sm">
              {currentIndex + 1} / {mediaList.length}
            </div>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto">
            <Button variant="ghost" size="sm" onClick={() => setShowMetadata(!showMetadata)} className="text-slate-300">
              <Info className="w-5 h-5 mr-2" />
              Info
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300">
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
            <Button variant="primary" size="sm">
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Navigation Controls */}
        <button onClick={prevMedia} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button onClick={nextMedia} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Main Media Container */}
        <div className={`flex-1 flex items-center justify-center p-16 transition-all duration-300 ${showMetadata ? 'mr-80' : ''}`}>
          <div className="relative w-full h-full flex items-center justify-center">
            {currentMedia.media_type === 'video' && currentMedia.cloudinary_public_id ? (
              <div className="w-full max-w-4xl max-h-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <CldVideoPlayer
                  src={currentMedia.cloudinary_public_id}
                  width={currentMedia.width || 1920}
                  height={currentMedia.height || 1080}
                  controls
                />
              </div>
            ) : currentMedia.cloudinary_public_id ? (
              <CldImage
                src={currentMedia.cloudinary_public_id}
                width={currentMedia.width || 1920}
                height={currentMedia.height || 1080}
                alt="Fullscreen Media"
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                sizes="100vw"
                quality={100}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentMedia.file_url} className="max-w-full max-h-full object-contain" alt="Fullscreen" />
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 p-6 flex flex-col overflow-y-auto z-20 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-6">Details</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Event</div>
                  <div className="text-sm text-slate-200 font-medium">{currentMedia.event?.name || 'Unknown Event'}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Uploaded By</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {currentMedia.uploader?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-sm text-slate-200 font-medium">{currentMedia.uploader?.full_name || 'Anonymous'}</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <div className="text-sm font-bold text-violet-100">AI Analysis</div>
                  </div>
                  
                  {currentMedia.ai_tags && currentMedia.ai_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentMedia.ai_tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md text-xs font-semibold text-violet-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-lg border border-white/5">
                      Pending AI processing. Image tags and facial recognition vectors will appear here shortly.
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">File Info</div>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Resolution</span>
                      <span className="text-slate-200">{currentMedia.width || '?'} x {currentMedia.height || '?'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="text-slate-200 uppercase">{currentMedia.media_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span className="text-slate-200">{new Date(currentMedia.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
