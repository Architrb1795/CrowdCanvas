'use client';

import React, { useState, useTransition } from 'react';
import { Video, X, Download, User, Calendar, FileType, Maximize2, Trash2, Edit2, Save, Share2, Check, Lock, Globe } from 'lucide-react';
import { deleteMedia, saveMediaCopy, toggleMediaVisibility } from '@/lib/actions/media';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MediaGalleryGrid({ mediaItems, canManageEvent, currentUserId }: { mediaItems: any[], canManageEvent?: boolean, currentUserId?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFilter, setEditFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleDelete = async () => {
    if (!selectedMedia) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this media?');
    if (!confirmDelete) return;

    startTransition(async () => {
      const res = await deleteMedia(selectedMedia.id, selectedMedia.event_id);
      if (res.success) {
        setSelectedMedia(null);
      } else {
        alert(res.error || 'Failed to delete media');
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
        alert(res.error || 'Failed to toggle visibility');
      }
    });
  };

  const handleSaveCopy = async () => {
    if (!selectedMedia) return;
    if (!editFilter) {
      alert('Please select a filter before saving a copy.');
      return;
    }

    startTransition(async () => {
      const newUrl = applyTransformation(selectedMedia.file_url, editFilter);
      // For thumbnail, we can add a smart crop
      const newThumb = applyTransformation(selectedMedia.file_url, editFilter + ',c_fill,g_auto,w_500,h_500');
      
      const res = await saveMediaCopy(selectedMedia.id, selectedMedia.event_id, newUrl, newThumb);
      if (res.success) {
        alert('Saved as a new copy successfully!');
        setIsEditing(false);
        setEditFilter('');
        setSelectedMedia(null); // Close modal to see the new item in gallery
      } else {
        alert(res.error || 'Failed to save copy');
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

  return (
    <>
      {/* Bulk Selection Header */}
      {canManageEvent && mediaItems.length > 0 && (
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
                    <p className="text-slate-300 text-xs">
                      {new Date(media.created_at).toLocaleDateString()}
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
            <div className="w-full md:w-80 flex-shrink-0 bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto max-h-[40vh] md:max-h-full">
              
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
                        <p className="text-sm font-medium text-slate-200">
                          {new Date(selectedMedia.created_at).toLocaleString()}
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

                  <div className="mt-auto pt-6 space-y-3">
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
