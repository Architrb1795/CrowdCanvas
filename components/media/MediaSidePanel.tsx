'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Trash2, Edit2, Download, 
  Lock, Globe, Sparkles, FileType, User, ChevronDown, Eye, Maximize2, Bookmark, Tag
} from 'lucide-react';

const formatBytes = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export interface MediaSidePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any;
  currentUserId?: string | null;
  canEditOrDelete?: boolean;
  canManageEvent?: boolean;
  isPending?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: (e: React.MouseEvent, url: string, filename: string) => void;
  onTogglePrivacy?: () => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onGenerateAI?: () => void;
  isGeneratingAI?: boolean;
  onTagClick?: () => void;
  isTaggingMode?: boolean;
  bottomContent?: React.ReactNode;
}

export function MediaSidePanel({
  media,
  canEditOrDelete,
  canManageEvent,
  isPending,
  onEdit,
  onDelete,
  onDownload,
  onTogglePrivacy,
  onCommentClick,
  onShareClick,
  onGenerateAI,
  isGeneratingAI,
  onTagClick,
  isTaggingMode,
  bottomContent
}: MediaSidePanelProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  
  // Favourites state
  const [hasFavourited, setHasFavourited] = useState(false);
  const [isFavouriting, setIsFavouriting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSocialData = async () => {
      try {
        const likeRes = await fetch(`/api/social/like?mediaId=${media.id}`);
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          if (isMounted) {
            setLikesCount(likeData.likesCount || 0);
            setHasLiked(likeData.hasLiked || false);
          }
        }
        const commentRes = await fetch(`/api/social/comment?mediaId=${media.id}`);
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          if (isMounted) {
            setCommentsCount(commentData.comments?.length || 0);
          }
        }
        const favRes = await fetch(`/api/social/favourite?mediaId=${media.id}`);
        if (favRes.ok) {
          const favData = await favRes.json();
          if (isMounted) setHasFavourited(favData.hasFavourited || false);
        }
      } catch (error) {
        console.error("Failed to fetch social data", error);
      }
    };
    fetchSocialData();
    return () => { isMounted = false; };
  }, [media.id]);

  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const previousHasLiked = hasLiked;
    const previousLikesCount = likesCount;
    setHasLiked(!hasLiked);
    setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
      const method = hasLiked ? 'DELETE' : 'POST';
      const res = await fetch('/api/social/like', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: media.id })
      });
      if (!res.ok) throw new Error('Failed to toggle like');
    } catch (error) {
      setHasLiked(previousHasLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleFavouriteToggle = async () => {
    if (isFavouriting) return;
    setIsFavouriting(true);
    const previousHasFavourited = hasFavourited;
    setHasFavourited(!hasFavourited);

    try {
      const method = hasFavourited ? 'DELETE' : 'POST';
      const res = await fetch(`/api/social/favourite${hasFavourited ? `?mediaId=${media.id}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: hasFavourited ? undefined : JSON.stringify({ mediaId: media.id })
      });
      if (!res.ok) throw new Error('Failed to toggle favourite');
    } catch (error) {
      setHasFavourited(previousHasFavourited);
    } finally {
      setIsFavouriting(false);
    }
  };

  const visibleTags = media.ai_tags || [];
  const tagsToShow = showAllTags ? visibleTags : visibleTags.slice(0, 6);
  const uploaderName = media.profiles?.full_name || media.uploader?.full_name || 'Anonymous User';
  const uploaderInitial = uploaderName.charAt(0).toUpperCase();

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-[#0f172a] border-l border-white/5 flex flex-col h-full overflow-hidden shadow-2xl relative">
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full min-h-0 p-5 space-y-6">
        
        {/* SECTION 1: Quick Actions */}
        <section className="grid grid-cols-4 gap-2">
          <button 
            onClick={handleLikeToggle}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all group ${
              hasLiked ? 'bg-gradient-to-b from-rose-500/20 to-rose-500/5 text-rose-500 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <motion.div whileTap={{ scale: 0.8 }} animate={{ scale: hasLiked ? [1, 1.2, 1] : 1 }}>
              <Heart className={`w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform ${hasLiked ? 'fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''}`} />
            </motion.div>
            <span className="text-[11px] font-bold tracking-wide">{likesCount}</span>
          </button>

          <button 
            onClick={handleFavouriteToggle}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all group ${
              hasFavourited ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/5'
            }`}
          >
            <motion.div whileTap={{ scale: 0.8 }} animate={{ scale: hasFavourited ? [1, 1.2, 1] : 1 }}>
              <Bookmark className={`w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform ${hasFavourited ? 'fill-current drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}`} />
            </motion.div>
            <span className="text-[11px] font-bold tracking-wide">Save</span>
          </button>

          <button 
            onClick={onCommentClick}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/5 transition-all group"
          >
            <MessageCircle className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold tracking-wide">{commentsCount}</span>
          </button>

          <button 
            onClick={onShareClick}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-white/5 transition-all group"
          >
            <Share2 className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold tracking-wide">Share</span>
          </button>
        </section>

        {/* SECTION 2: Creator Information */}
        <section className="p-4 bg-slate-800/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white leading-tight">
              {media.title || 'Untitled Media'}
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                {uploaderInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-300 leading-tight truncate">
                  {uploaderName}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Uploaded By</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Media Summary (Premium AI Box) */}
        {media.ai_caption && (
          <section className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl p-5 border border-indigo-500/20 relative overflow-hidden shadow-inner">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
              <Sparkles className="w-24 h-24" />
            </div>
            <h3 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Summary
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed relative z-10">
              {media.ai_caption}
            </p>
          </section>
        )}

        {/* SECTION 4: Visible Tags */}
        {visibleTags.length > 0 && (
          <section>
            <div className="flex flex-wrap gap-2">
              {tagsToShow.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-slate-800/50 border border-white/5 rounded-lg text-xs text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-colors cursor-default">
                  #{tag.replace(/\s+/g, '-').toLowerCase()}
                </span>
              ))}
              {visibleTags.length > 6 && !showAllTags && (
                <button 
                  onClick={() => setShowAllTags(true)}
                  className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-400 font-medium hover:bg-indigo-500/20 transition-colors"
                >
                  +{visibleTags.length - 6} more
                </button>
              )}
            </div>
          </section>
        )}

        {/* SECTION 5: Media Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Heart className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Likes</p>
              <p className="text-sm font-bold text-white leading-tight">{likesCount}</p>
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><MessageCircle className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Comments</p>
              <p className="text-sm font-bold text-white leading-tight">{commentsCount}</p>
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Eye className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Views</p>
              <p className="text-sm font-bold text-white leading-tight">{media.views_count || 0}</p>
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Download className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Downloads</p>
              <p className="text-sm font-bold text-white leading-tight">{media.downloads_count || 0}</p>
            </div>
          </div>
        </section>

        {/* SECTION 6: File Information */}
        <section className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden">
          <button 
            onClick={() => setShowFileDetails(!showFileDetails)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2"><FileType className="w-4 h-4 text-slate-500" /> File Details</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showFileDetails ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showFileDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3 text-xs text-slate-400">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span>Uploaded</span>
                    <span className="text-slate-200" suppressHydrationWarning>{new Date(media.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  {(media.width && media.height) && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span>Dimensions</span>
                      <span className="text-slate-200">{media.width} × {media.height} px</span>
                    </div>
                  )}
                  {media.file_size && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span>Size</span>
                      <span className="text-slate-200">{formatBytes(media.file_size)}</span>
                    </div>
                  )}
                  {media.mime_type && (
                    <div className="flex justify-between items-center">
                      <span>Type</span>
                      <span className="text-slate-200 uppercase">{media.mime_type.split('/')[1] || media.mime_type}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SECTION 7: Advanced AI Insights */}
        {(media.mood || media.scene_type || media.ai_style || media.dominant_colors || media.people_count !== undefined) && (
          <section className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden relative">
            <div className="p-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Maximize2 className="w-3.5 h-3.5" /> AI Insight Tags
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                {media.mood && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mood</p>
                    <p className="text-slate-200 font-medium capitalize">{media.mood}</p>
                  </div>
                )}
                {media.scene_type && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Scene</p>
                    <p className="text-slate-200 font-medium capitalize">{media.scene_type}</p>
                  </div>
                )}
                {media.ai_style && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Style</p>
                    <p className="text-slate-200 font-medium capitalize">{media.ai_style}</p>
                  </div>
                )}
                {media.complexity && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Complexity</p>
                    <p className="text-slate-200 font-medium capitalize">{media.complexity}</p>
                  </div>
                )}
                {media.ai_confidence !== undefined && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confidence</p>
                    <p className="text-slate-200 font-medium capitalize">{media.ai_confidence}%</p>
                  </div>
                )}
              </div>
            </div>
            
            {media.ocr_text && (
              <button 
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="w-full flex items-center justify-between p-4 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors border-t border-white/5"
              >
                View OCR Text
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showFullAnalysis ? 'rotate-180' : ''}`} />
              </button>
            )}
            
            <AnimatePresence>
              {showFullAnalysis && media.ocr_text && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 text-xs text-slate-300">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                      <p className="italic leading-relaxed">{media.ocr_text}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* AI Action Button */}
        {onGenerateAI && media.media_type === 'photo' && (
           <div className="flex justify-center pt-2">
             <button 
               onClick={onGenerateAI}
               disabled={isGeneratingAI}
               className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-full"
             >
               {isGeneratingAI ? <span className="animate-spin">⟳</span> : <Sparkles className="w-3.5 h-3.5" />}
               {isGeneratingAI ? 'Analyzing...' : (media.ai_caption ? 'Regenerate Analysis' : 'Generate AI Analysis')}
             </button>
           </div>
        )}

        {bottomContent && (
          <div className="pt-2">
            {bottomContent}
          </div>
        )}

        {/* SECTION 8: Social Actions */}
        {media.media_type === 'photo' && onTagClick && (
          <section className="pt-4 mt-4 border-t border-white/5 space-y-2">
            <button 
              onClick={onTagClick}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border ${
                isTaggingMode 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-white/5 hover:border-white/10'
              }`}
            >
              <Tag className="w-4 h-4" />
              {isTaggingMode ? 'Finish Tagging' : 'Tag Friends'}
            </button>
          </section>
        )}

        {/* SECTION 9: Danger Zone & Tools */}
        {canEditOrDelete && (
          <section className="pt-4 mt-4 border-t border-white/5 space-y-2">
            {onDownload && (
              <button 
                onClick={(e) => onDownload(e, media.file_url, `crowdcanvas_${media.id}.${media.file_url.split('.').pop()}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-3.5 rounded-xl text-sm font-semibold transition-all border border-white/5 hover:border-white/10"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}

            {media.media_type === 'photo' && onEdit && (
              <button 
                onClick={onEdit}
                className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-3.5 rounded-xl text-sm font-semibold transition-all border border-white/5 hover:border-white/10"
              >
                <Edit2 className="w-4 h-4" />
                Edit Photo
              </button>
            )}

            {onTogglePrivacy && canManageEvent && (
              <button 
                onClick={onTogglePrivacy}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {media.is_private ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {media.is_private ? 'Make Public' : 'Make Private'}
              </button>
            )}

            {onDelete && (
              <button 
                onClick={onDelete}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3.5 rounded-xl text-sm font-semibold border border-red-500/20 transition-colors disabled:opacity-50 mt-4"
              >
                <Trash2 className="w-4 h-4" />
                Delete Media
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
