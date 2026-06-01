'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MediaSocialBarProps {
  mediaId: string;
  onCommentClick: () => void;
  onShareClick: () => void;
  className?: string;
}

export default function MediaSocialBar({ mediaId, onCommentClick, onShareClick, className = '' }: MediaSocialBarProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSocialData = async () => {
      setLoading(true);
      try {
        // Fetch Likes
        const likeRes = await fetch(`/api/social/like?mediaId=${mediaId}`);
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          if (isMounted) {
            setLikesCount(likeData.likesCount || 0);
            setHasLiked(likeData.hasLiked || false);
          }
        }

        // Fetch Comments
        const commentRes = await fetch(`/api/social/comment?mediaId=${mediaId}`);
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          if (isMounted) {
            setCommentsCount(commentData.comments?.length || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch social data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSocialData();
    return () => { isMounted = false; };
  }, [mediaId]);

  const handleLikeToggle = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    // Optimistic update
    const previousHasLiked = hasLiked;
    const previousLikesCount = likesCount;
    
    setHasLiked(!hasLiked);
    setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
      const method = hasLiked ? 'DELETE' : 'POST';
      const res = await fetch('/api/social/like', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }
    } catch (error) {
      console.error(error);
      // Revert on failure
      setHasLiked(previousHasLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLikeToggle}
        className={`flex items-center gap-2 transition-all ${hasLiked ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10' : 'text-slate-300 hover:text-white'}`}
      >
        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
        <span className="font-medium">{likesCount}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onCommentClick}
        className="flex items-center gap-2 text-slate-300 hover:text-white"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">{commentsCount}</span>
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onShareClick}
        className="flex items-center gap-2 text-slate-300 hover:text-white"
      >
        <Share2 className="w-5 h-5" />
      </Button>
    </div>
  );
}
