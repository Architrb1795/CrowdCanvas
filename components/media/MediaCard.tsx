'use client';

import React from 'react';
import { CldImage } from 'next-cloudinary';
import { Play, User, Calendar, Tag, Heart, MessageCircle } from 'lucide-react';
import type { MediaItem } from './MediaGallery';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export default function MediaCard({ item, onClick }: MediaCardProps) {
  // Determine an aspect ratio based on DB dimensions to prevent masonry jumps
  const aspectRatio = item.width && item.height ? item.height / item.width : 1;
  // Estimate height given a fixed column width (e.g., 300px)
  const estimatedHeight = Math.max(200, Math.min(600, 300 * aspectRatio));

  return (
    <div 
      onClick={onClick}
      className="relative break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-slate-900 shadow-xl shadow-black/20"
      style={{ height: estimatedHeight }}
    >
      {item.cloudinary_public_id ? (
        <CldImage
          src={item.cloudinary_public_id}
          width={item.width || 800}
          height={item.height || 800}
          alt={item.id}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          placeholder="blur"
          blurDataURL={item.thumbnail_url || undefined}
          format="auto"
          quality="auto"
          crop="fill"
          // If it's a video, CldImage can still load the automatically generated thumbnail by Cloudinary
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={item.file_url} 
          alt="Media" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      )}

      {/* Video Indicator */}
      {item.media_type === 'video' && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg z-10">
          <Play className="w-4 h-4 text-white ml-0.5" />
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        
        {/* Event Name */}
        {item.event?.name && (
          <div className="flex items-center gap-1.5 text-white font-semibold text-sm mb-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">{item.event.name}</span>
          </div>
        )}

        {/* Uploader */}
        {item.uploader?.full_name && (
          <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-3">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{item.uploader.full_name}</span>
          </div>
        )}

        {/* Social Metrics & Tags */}
        <div className="flex items-center justify-between mt-auto">
          {/* Tags */}
          <div className="flex items-center gap-2 overflow-hidden">
            {item.ai_tags && item.ai_tags.length > 0 ? (
              item.ai_tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-500/50 rounded-md text-[10px] font-bold text-indigo-200 whitespace-nowrap">
                  {tag}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 bg-slate-800/80 border border-white/10 rounded-md text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3" /> AI Unprocessed
              </span>
            )}
          </div>

          {/* Social Counts */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-slate-300">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium">{item.likes?.[0]?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{item.comments?.[0]?.count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
