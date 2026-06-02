'use client';

import React, { useState } from 'react';
import { Link as LinkIcon, Download, Check, Share2 } from 'lucide-react';
import { triggerSecureDownload } from '@/lib/utils/download';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface MediaShareModalProps {
  mediaId: string;
  mediaUrl: string; // the actual raw file url
  thumbnailUrl?: string; // For preview
  mediaTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaShareModal({ mediaId, mediaUrl, thumbnailUrl, mediaTitle, isOpen, onClose }: MediaShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?media=${mediaId}` : mediaUrl;

  const handleShare = async (type: string, action: () => void) => {
    fetch('/api/social/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, shareType: type })
    }).catch(e => console.error("Tracking failed", e));
    action();
  };

  const copyToClipboard = () => {
    handleShare('copy_link', async () => {
      try {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  };

  const openTwitter = () => {
    handleShare('twitter', () => {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(mediaTitle || 'Check out this awesome media on CrowdCanvas!')}`, '_blank');
    });
  };

  const openFacebook = () => {
    handleShare('facebook', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
    });
  };

  const openWhatsApp = () => {
    handleShare('whatsapp', () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${mediaTitle ? mediaTitle + ' - ' : ''}Check out this awesome media on CrowdCanvas! ${shareLink}`)}`, '_blank');
    });
  };

  const handleDownload = async () => {
    handleShare('download', async () => {
      await triggerSecureDownload(mediaId, mediaUrl);
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={<div className="flex items-center gap-2"><Share2 className="w-5 h-5"/> Share Media</div>}>
      <div className="flex flex-col gap-6">
        
        {/* Preview Area */}
        <div className="flex gap-4 p-3 bg-white/5 border border-white/10 rounded-xl items-center">
          <div className="w-16 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 flex items-center justify-center relative border border-white/10">
            {thumbnailUrl || mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl || mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white/20"><Share2 /></div>
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{mediaTitle || 'Event Media'}</h4>
            <p className="text-xs text-slate-400 mt-1">Anyone with the link can view this.</p>
          </div>
        </div>

        {/* Social Icons */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center gap-2">
            <button onClick={openTwitter} className="w-12 h-12 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center transition-all hover:scale-110">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <span className="text-xs text-slate-400 font-medium">X (Twitter)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={openFacebook} className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 flex items-center justify-center transition-all hover:scale-110">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
            </button>
            <span className="text-xs text-slate-400 font-medium">Facebook</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={openWhatsApp} className="w-12 h-12 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-all hover:scale-110">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <span className="text-xs text-slate-400 font-medium">WhatsApp</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={handleDownload} className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 flex items-center justify-center transition-all hover:scale-110">
              <Download className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Download</span>
          </div>
        </div>

        {/* Link Copy */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            readOnly
            value={shareLink}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-24 py-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
            <Button 
              size="sm" 
              onClick={copyToClipboard}
              className={`h-9 text-xs px-4 transition-all duration-300 rounded-lg ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {copied ? (
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Copied</span>
              ) : (
                'Copy Link'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
