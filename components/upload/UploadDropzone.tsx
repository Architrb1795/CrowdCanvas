'use client';

import React, { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { UploadCloud, FileImage, FileVideo, AlertCircle, Loader2 } from 'lucide-react';
import { syncMediaToDatabase } from '@/lib/actions/media';

interface UploadDropzoneProps {
  eventId: string | null;
  isPrivate: boolean;
  onUploadComplete?: () => void;
}

export default function UploadDropzone({ eventId, isPrivate, onUploadComplete }: UploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadSuccess = async (result: any) => {
    if (!eventId) return;
    
    setIsUploading(true);
    setErrorMsg(null);
    
    try {
      const info = result.info;
      
      // Sync metadata to our Supabase database
      const dbResult = await syncMediaToDatabase(eventId, {
        public_id: info.public_id,
        secure_url: info.secure_url,
        width: info.width,
        height: info.height,
        bytes: info.bytes,
        format: info.format,
        resource_type: info.resource_type,
        duration: info.duration,
      }, isPrivate);

      if (!dbResult.success) {
        setErrorMsg(dbResult.error || 'Database sync failed.');
      } else {
        if (onUploadComplete) onUploadComplete();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred processing the upload.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!eventId) {
    return (
      <div className="w-full h-80 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-8 text-center transition-colors">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Select an Event First</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Every photo and video must belong to a specific event. Please select an event from the dropdown to begin uploading.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={handleUploadSuccess}
        options={{
          multiple: true,
          maxFiles: 50,
          resourceType: 'auto', // accepts images and videos
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'],
          maxFileSize: 104857600, // 100MB limit
          styles: {
            palette: {
              window: '#020617',
              windowBorder: '#1e293b',
              tabIcon: '#818cf8',
              menuIcons: '#cbd5e1',
              textDark: '#0f172a',
              textLight: '#f8fafc',
              link: '#6366f1',
              action: '#4f46e5',
              inactiveTabIcon: '#475569',
              error: '#ef4444',
              inProgress: '#6366f1',
              complete: '#10b981',
              sourceBg: '#0f172a'
            }
          }
        }}
      >
        {({ open }) => {
          return (
            <div 
              onClick={() => !isUploading && open()}
              className={`w-full h-80 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center group cursor-pointer ${
                isUploading 
                  ? 'border-indigo-500/50 bg-indigo-500/5 cursor-wait' 
                  : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-800/80'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <div className="text-lg font-bold text-slate-200">Processing Uploads...</div>
                  <p className="text-sm text-slate-500">Syncing AI metadata to our secure databases. Please wait.</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300 flex items-center justify-center mb-6 shadow-xl">
                    <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">Drag & Drop Media</h3>
                  <p className="text-base text-slate-400 mb-6 max-w-md leading-relaxed">
                    Upload high-resolution photos and videos. Supports JPG, PNG, WEBP, MP4, MOV up to 100MB per file.
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5"><FileImage className="w-3.5 h-3.5" /> Photos</span>
                    <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5"><FileVideo className="w-3.5 h-3.5" /> Videos</span>
                  </div>
                </>
              )}
            </div>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}
