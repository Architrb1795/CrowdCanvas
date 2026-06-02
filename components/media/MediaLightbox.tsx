'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2, Info, Sparkles } from 'lucide-react';
import type { MediaItem } from './MediaGallery';
import { triggerSecureDownload } from '@/lib/utils/download';
import { CldImage, CldVideoPlayer } from 'next-cloudinary';
import { Button } from '@/components/ui/Button';
import { MediaSidePanel } from './MediaSidePanel';
import MediaCommentsDrawer from './MediaCommentsDrawer';
import MediaShareModal from './MediaShareModal';
import PhotoTaggingOverlay from './PhotoTaggingOverlay';
import { createClient } from '@/lib/supabase/client';

interface MediaLightboxProps {
  mediaList: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({ mediaList, initialIndex, onClose }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowMetadata(!showMetadata);
                if (!showMetadata) setShowComments(false);
              }} 
              className={`text-slate-300 ${showMetadata ? 'bg-white/10 text-white' : ''}`}
            >
              <Info className="w-5 h-5 mr-2" />
              Info
            </Button>
            <Button variant="primary" size="sm" onClick={() => triggerSecureDownload(currentMedia.id, currentMedia.file_url)}>
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
        <div className={`flex-1 flex items-center justify-center p-16 transition-all duration-300 ${showMetadata || showComments ? 'mr-80' : ''}`}>
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
              <img src={currentMedia.file_url} className="max-w-full max-h-full object-contain pointer-events-auto relative z-0" alt="Fullscreen" />
            )}

            {currentMedia.media_type === 'photo' && (
              <PhotoTaggingOverlay
                mediaId={currentMedia.id}
                isTaggingMode={isTaggingMode}
                onTaggingComplete={() => setIsTaggingMode(false)}
                currentUserId={currentUserId}
              />
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
              className="absolute right-0 top-0 bottom-0 z-20 shadow-2xl"
            >
              <MediaSidePanel 
                media={currentMedia}
                currentUserId={currentUserId}
                onCommentClick={() => {
                  setShowComments(true);
                  setShowMetadata(false);
                }}
                onShareClick={() => setShowShare(true)}
                onDownload={() => triggerSecureDownload(currentMedia.id, currentMedia.file_url)}
                onTagClick={() => setIsTaggingMode(!isTaggingMode)}
                isTaggingMode={isTaggingMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Drawer */}
        <MediaCommentsDrawer 
          mediaId={currentMedia.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          currentUserId={currentUserId}
        />

        {/* Share Modal */}
        <MediaShareModal 
          mediaId={currentMedia.id}
          mediaUrl={currentMedia.file_url}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
}
