'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
}

interface MediaCommentsDrawerProps {
  mediaId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

export default function MediaCommentsDrawer({ mediaId, isOpen, onClose, currentUserId }: MediaCommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { confirm } = useGlobalDialog();

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/social/comment?mediaId=${mediaId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setComments(data.comments || []);
        }
      } catch (error) {
        console.error("Failed to fetch comments", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchComments();
    return () => { isMounted = false; };
  }, [mediaId, isOpen]);

  useEffect(() => {
    // Scroll to bottom when comments change
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/social/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, content: newComment })
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = await confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;

    // Optimistic delete
    const previousComments = [...comments];
    setComments(comments.filter(c => c.id !== commentId));

    try {
      const res = await fetch('/api/social/comment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error(error);
      setComments(previousComments); // Revert
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h3 className="font-bold text-white text-lg">Comments</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No comments yet.</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="group flex gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-xs overflow-hidden">
                    {comment.user_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                    ) : (
                      comment.user_name.charAt(0)
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-medium text-sm text-slate-200 truncate pr-2">{comment.user_name}</span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 break-words whitespace-pre-wrap">{comment.content}</p>
                  </div>

                  {/* Actions (Delete if owner) */}
                  {currentUserId === comment.user_id && (
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                size="sm" 
                variant="primary" 
                className="rounded-full w-10 h-10 p-0 shrink-0"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
