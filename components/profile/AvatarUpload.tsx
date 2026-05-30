'use client';

import React, { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Camera, Loader2 } from 'lucide-react';
import { updateAvatar } from '@/lib/actions/profile';
import Image from 'next/image';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({ currentAvatarUrl, fullName, size = 'lg' }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const initials = fullName.substring(0, 2).toUpperCase() || '??';

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadSuccess = async (result: any) => {
    setIsUploading(true);
    try {
      const info = result.info;
      const res = await updateAvatar(info.secure_url);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || 'Failed to update avatar in database.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onSuccess={handleUploadSuccess}
      options={{
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5242880, // 5MB limit
        cropping: true,
        styles: {
          palette: {
            window: '#020617',
            windowBorder: '#1e293b',
            tabIcon: '#818cf8',
            textDark: '#0f172a',
            textLight: '#f8fafc',
            link: '#6366f1',
            action: '#4f46e5',
            inProgress: '#6366f1',
            complete: '#10b981',
            sourceBg: '#0f172a'
          }
        }
      }}
    >
      {({ open }) => (
        <div 
          onClick={() => !isUploading && open()}
          className={`relative shrink-0 rounded-full group overflow-hidden cursor-pointer bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 ${sizeClasses[size]}`}
        >
          {isUploading ? (
            <Loader2 className="w-1/2 h-1/2 animate-spin text-indigo-500" />
          ) : currentAvatarUrl ? (
            <Image 
              src={currentAvatarUrl} 
              alt={fullName} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 120px"
            />
          ) : (
            initials
          )}

          {/* Hover overlay */}
          {!isUploading && (
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Camera className="w-1/3 h-1/3 text-white" />
            </div>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
}
