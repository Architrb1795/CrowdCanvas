/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Video, X, Download, User, Calendar, FileType, Maximize2, Trash2, Edit2, Save, Share2, Check, Lock, Globe, Sparkles, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteMedia, saveMediaCopy, toggleMediaVisibility } from '@/lib/actions/media';
import { createClient } from '@/lib/supabase/client';
import { RecommendationCard } from './RecommendationCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MediaGalleryGrid({ mediaItems, canManageEvent, currentUserId }: { mediaItems: any[], canManageEvent?: boolean, currentUserId?: string }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFilter, setEditFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);
  const [similarMedia, setSimilarMedia] = useState<any[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [recommendationSessionId, setRecommendationSessionId] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  const selectedIndex = selectedMedia ? mediaItems.findIndex(m => m.id === selectedMedia.id) : -1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex > 0) setSelectedMedia(mediaItems[selectedIndex - 1]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex < mediaItems.length - 1) setSelectedMedia(mediaItems[selectedIndex + 1]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMedia || isEditing) return;
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedMedia(mediaItems[selectedIndex - 1]);
      } else if (e.key === 'ArrowRight' && selectedIndex < mediaItems.length - 1) {
        setSelectedMedia(mediaItems[selectedIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, isEditing, selectedIndex, mediaItems]);

  useEffect(() => {
    if (selectedMedia && !isEditing) {
      setSimilarMedia([]);
      setRecommendationSessionId('');
      setIsLoadingSimilar(true);
      fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: selectedMedia.id })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.recommendations) {
            setSimilarMedia(data.recommendations);
            const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
            setRecommendationSessionId(sessionId);
            
            fetch('/api/ai/recommend/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.recommendations.map((r: any, idx: number) => ({
                    source_media_id: selectedMedia.id,
                    recommended_media_id: r.id,
                    event_type: 'generated',
                    session_id: sessionId,
                    position: idx,
                    score: r.matchPercentage,
                    category: r.category,
                    reason: r.reason
                })))
            }).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSimilar(false));
    }
  }, [selectedMedia, isEditing]);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`);
    if (!confirmDelete) return;

    startTransition(async () => {
      let failed = 0;
      for (const id of selectedIds) {
        const item = mediaItems.find(m => m.id === id);
        if (item) {
          const res = await deleteMedia(id, item.event_id);
          if (!res.success) failed++;
        }
      }
      if (failed > 0) alert(`Failed to delete ${failed} items.`);
      setSelectedIds([]);
      setIsSelectionMode(false);
    });
  };

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const applyTransformation = (url: string, transformation: string) => {
    if (!url || !url.includes('/upload/')) return url;
    if (!transformation) return url;
    // Always append f_auto,q_auto for optimization
    return url.replace('/upload/', `/upload/${transformation},f_auto,q_auto/`);
  };

  const currentPreviewUrl = isEditing 
    ? applyTransformation(selectedMedia?.file_url, editFilter)
    : selectedMedia?.file_url;

  const handleGenerateImageAI = async () => {
    if (!selectedMedia) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: selectedMedia.id,
          eventId: selectedMedia.event_id,
          fileUrl: selectedMedia.file_url,
          mediaType: selectedMedia.media_type
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let msg = 'Failed to generate AI analysis';
        if (errorData?.error) {
          msg = typeof errorData.error === 'object' ? errorData.error.message || JSON.stringify(errorData.error) : errorData.error;
          
          // Attempt to parse if the backend forwarded a stringified JSON error
          try {
            const jsonStart = msg.indexOf('{');
            if (jsonStart !== -1) {
              const parsed = JSON.parse(msg.substring(jsonStart));
              if (parsed?.error?.message) msg = parsed.error.message;
              else if (parsed?.message) msg = parsed.message;
            }
          } catch(e) {
            // Ignore parse errors
          }

          // Apply friendly fallback for known rate limits
          if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503')) {
            msg = "AI Service is currently experiencing high demand. Please wait a few moments and try again.";
          }
        }
        setErrorDialog(msg);
        return;
      }

      // Fetch the updated media item to show the new insights instantly
      const supabase = createClient();
      const { data } = await supabase.from('media').select('*').eq('id', selectedMedia.id).single();
      if (data) {
        setSelectedMedia(data);
        router.refresh(); // Sync the server-side mediaItems prop so it persists when modal is closed
      }
    } catch (err: any) {
      console.error(err);
      setErrorDialog('Failed to connect to AI service. Please check your internet connection and try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMedia) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this media?');
    if (!confirmDelete) return;

    startTransition(async () => {
      const res = await deleteMedia(selectedMedia.id, selectedMedia.event_id);
      if (res.success) {
        setSelectedMedia(null);
      } else {
        setErrorDialog(res.error || 'Failed to delete media');
      }
    });
  };

  const handleToggleVisibility = async () => {
    if (!selectedMedia) return;
    startTransition(async () => {
      const res = await toggleMediaVisibility(selectedMedia.id, selectedMedia.event_id, !selectedMedia.is_private);
      if (res.success) {
        setSelectedMedia({ ...selectedMedia, is_private: !selectedMedia.is_private });
      } else {
        setErrorDialog(res.error || 'Failed to toggle visibility');
      }
    });
  };

  const handleSaveCopy = async () => {
    if (!selectedMedia) return;
    if (!editFilter) {
      setErrorDialog('Please select a filter before saving a copy.');
      return;
    }

    startTransition(async () => {
      const newUrl = applyTransformation(selectedMedia.file_url, editFilter);
      // For thumbnail, we can add a smart crop
      const newThumb = applyTransformation(selectedMedia.file_url, editFilter + ',c_fill,g_auto,w_500,h_500');
      
      const res = await saveMediaCopy(selectedMedia.id, selectedMedia.event_id, newUrl, newThumb);
      if (res.success) {
        // alert('Saved as a new copy successfully!');
        setIsEditing(false);
        setEditFilter('');
        setSelectedMedia(null); // Close modal to see the new item in gallery
      } else {
        setErrorDialog(res.error || 'Failed to save copy');
      }
    });
  };

  const handleCopyLink = () => {
    if (selectedMedia) {
      navigator.clipboard.writeText(selectedMedia.file_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const canEditOrDelete = canManageEvent || selectedMedia?.uploaded_by === currentUserId;

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Video className="w-10 h-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Media Found</h3>
        <p className="text-slate-400 max-w-sm mb-8">
          This gallery is currently empty. Be the first to upload photos or videos to this event!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Error Dialog */}
      {errorDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
            <div className="flex gap-4 items-start mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Action Failed</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{errorDialog}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorDialog(null)}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Bulk Selection Header */}
      {canManageEvent && (
        <div className="flex justify-between items-center mb-6 p-4 bg-slate-900 rounded-xl border border-white/5 shadow-sm">
          <div className="text-sm font-medium text-slate-300">
            {isSelectionMode ? `${selectedIds.length} items selected` : 'Manage Gallery'}
          </div>
          <div className="flex gap-3">
            {isSelectionMode ? (
              <>
                <button 
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0 || isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  Delete Selected
                </button>
                <button 
                  onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsSelectionMode(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Select Items
              </button>
            )}
          </div>
        </div>
      )}

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {mediaItems?.map((media) => (
          <div 
            key={media.id} 
            onClick={(e) => {
              if (isSelectionMode) toggleSelection(e, media.id);
              else setSelectedMedia(media);
            }}
            className={`break-inside-avoid relative group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border ${
              selectedIds.includes(media.id) ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[0.98]' : 'border-slate-200'
            } bg-slate-100 cursor-pointer`}
          >
            {isSelectionMode && (
              <div className="absolute top-3 left-3 z-20">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedIds.includes(media.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-black/20 border-white/80 backdrop-blur-sm'
                }`}>
                  {selectedIds.includes(media.id) && <Check className="w-4 h-4" />}
                </div>
              </div>
            )}

            {media.media_type === 'video' ? (
              <div className="aspect-video bg-slate-900 flex items-center justify-center">
                 <Video className="h-8 w-8 text-white opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={media.thumbnail_url || media.file_url} 
                alt="Event media" 
                className={`w-full h-auto object-cover transition-all ${isSelectionMode && !selectedIds.includes(media.id) ? 'opacity-70 grayscale-[30%]' : ''}`}
                loading="lazy"
              />
            )}
            
            {/* Overlay */}
            {!isSelectionMode && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium flex items-center gap-2">
                      {media.profiles?.full_name || 'Unknown'}
                      {media.is_private && <Lock className="w-3 h-3 text-red-400" />}
                    </p>
                    <p className="text-slate-300 text-xs" suppressHydrationWarning>
                      {new Date(media.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedMedia(null)}></div>
          
          <div className="relative w-full max-w-7xl max-h-full flex flex-col md:flex-row bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-10 animate-in zoom-in-95 duration-200">
            
            {/* Action Bar (Top Left over Image) */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button 
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors text-sm font-medium"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              
              {canManageEvent && (
                <button 
                  onClick={handleToggleVisibility}
                  disabled={isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {selectedMedia.is_private ? <Lock className="w-4 h-4 text-red-400" /> : <Globe className="w-4 h-4 text-blue-400" />}
                  {selectedMedia.is_private ? 'Make Public' : 'Make Private'}
                </button>
              )}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Visual Area */}
            <div className="flex-1 bg-black flex flex-col items-center justify-center min-h-[40vh] md:min-h-0 relative">
              {/* Left Navigation */}
              {selectedIndex > 0 && (
                <button 
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              
              {/* Right Navigation */}
              {selectedIndex >= 0 && selectedIndex < mediaItems.length - 1 && (
                <button 
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}

              {selectedMedia.media_type === 'video' ? (
                <video 
                  src={currentPreviewUrl} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-[80vh] md:max-h-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={currentPreviewUrl} 
                  alt="Full resolution media" 
                  className="max-w-full max-h-[80vh] md:max-h-full object-contain transition-all duration-300"
                />
              )}
            </div>

            {/* Metadata Sidebar */}
            <div className="w-full md:w-80 flex-shrink-0 bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar max-h-[40vh] md:max-h-full">
              
              {isEditing ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                  <h3 className="text-xl font-bold text-white mb-6">Editor Tools</h3>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Filters</p>
                    <button onClick={() => setEditFilter('')} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${editFilter === '' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Original</button>
                    <button onClick={() => setEditFilter('e_grayscale')} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${editFilter === 'e_grayscale' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Grayscale</button>
                    <button onClick={() => setEditFilter('e_sepia')} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${editFilter === 'e_sepia' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Vintage Sepia</button>
                    <button onClick={() => setEditFilter('e_blur:300')} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${editFilter === 'e_blur:300' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Soft Blur</button>
                    <button onClick={() => setEditFilter('e_art:incognito')} className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${editFilter === 'e_art:incognito' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Artistic</button>
                  </div>

                  <div className="mt-auto pt-6 space-y-3">
                    <button 
                      onClick={handleSaveCopy}
                      disabled={isPending || !editFilter}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save as Copy
                    </button>
                    <button 
                      onClick={() => { setIsEditing(false); setEditFilter(''); }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      Cancel Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {selectedMedia.events?.name || 'Event Media'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {selectedMedia.media_type === 'video' ? 'Video' : 'Photograph'}
                    </p>
                  </div>

                  <div className="space-y-4 my-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Uploaded By</p>
                        <p className="text-sm font-medium text-slate-200">{selectedMedia.profiles?.full_name || 'Unknown User'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Upload Date</p>
                        <p className="text-sm font-medium text-slate-200" suppressHydrationWarning>
                          {new Date(selectedMedia.created_at).toLocaleString('en-US')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <FileType className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">File Details</p>
                        <p className="text-sm font-medium text-slate-200">
                          {selectedMedia.mime_type || 'Unknown Type'} • {formatBytes(selectedMedia.file_size)}
                        </p>
                        {(selectedMedia.width && selectedMedia.height) && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {selectedMedia.width} × {selectedMedia.height} px
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Insights Panel */}
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-indigo-500/10 mb-6">
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> AI Analysis
                    </h4>
                    
                    {(selectedMedia.ai_caption || selectedMedia.mood || selectedMedia.scene_type) ? (
                      <>
                        {selectedMedia.ai_caption && (
                          <p className="text-sm text-slate-300 mb-3">{selectedMedia.ai_caption}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedMedia.mood && (
                            <div className="bg-slate-900 px-2 py-1.5 rounded flex flex-col">
                              <span className="text-slate-500">Mood</span>
                              <span className="text-slate-200 capitalize">{selectedMedia.mood}</span>
                            </div>
                          )}
                          {selectedMedia.scene_type && (
                            <div className="bg-slate-900 px-2 py-1.5 rounded flex flex-col">
                              <span className="text-slate-500">Scene</span>
                              <span className="text-slate-200 capitalize">{selectedMedia.scene_type}</span>
                            </div>
                          )}
                          {selectedMedia.people_count !== null && selectedMedia.people_count !== undefined && (
                            <div className="bg-slate-900 px-2 py-1.5 rounded flex flex-col">
                              <span className="text-slate-500">People</span>
                              <span className="text-slate-200">{selectedMedia.people_count}</span>
                            </div>
                          )}
                        </div>

                        {selectedMedia.ai_tags && selectedMedia.ai_tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {selectedMedia.ai_tags.map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-300 uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={handleGenerateImageAI}
                            disabled={isGeneratingAI || selectedMedia.media_type === 'video'}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={selectedMedia.media_type === 'video' ? "AI Analysis is only supported for photos" : "Regenerate Analysis"}
                          >
                            {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {isGeneratingAI ? 'Analyzing...' : 'Regenerate'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-500 mb-3">No AI insights generated for this image yet.</p>
                        <button 
                          onClick={handleGenerateImageAI}
                          disabled={isGeneratingAI || selectedMedia.media_type === 'video'}
                          className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          title={selectedMedia.media_type === 'video' ? "AI Analysis is only supported for photos" : "Generate Analysis"}
                        >
                          {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {isGeneratingAI ? 'Analyzing Image...' : 'Generate AI Analysis'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Similar Photos */}
                  {!isEditing && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Similar Photos</h4>
                      {isLoadingSimilar ? (
                        <div className="space-y-3">
                           {[1,2,3].map(i => (
                             <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-lg flex gap-3 p-2">
                               <div className="w-16 h-16 bg-slate-700 rounded-md"></div>
                               <div className="flex-1 space-y-2 py-1">
                                 <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                                 <div className="h-2 bg-slate-700 rounded w-2/3"></div>
                               </div>
                             </div>
                           ))}
                        </div>
                      ) : similarMedia.length > 0 ? (
                        <div className="space-y-2">
                          {similarMedia.map((media, idx) => (
                             <RecommendationCard
                                key={media.id}
                                media={media}
                                sourceMediaId={selectedMedia.id}
                                sessionId={recommendationSessionId}
                                currentUserId={currentUserId}
                                position={idx}
                                onClick={() => {
                                  const fullMedia = mediaItems.find(m => m.id === media.id);
                                  if (fullMedia) setSelectedMedia(fullMedia);
                                }}
                             />
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 text-center py-4 bg-slate-800/30 rounded-lg">
                           No similar photos found yet.<br/>Upload more media to improve recommendations.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto space-y-3">
                    {selectedMedia.media_type === 'photo' && canEditOrDelete && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                        Edit Photo
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => handleDownload(e, selectedMedia.file_url, `crowdcanvas_${selectedMedia.id}.${selectedMedia.file_url.split('.').pop()}`)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      <Download className="w-5 h-5" />
                      Download File
                    </button>

                    {canEditOrDelete && (
                      <button 
                        onClick={handleDelete}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 py-3 rounded-xl font-semibold transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Media
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
