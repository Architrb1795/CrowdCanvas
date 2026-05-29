import React from 'react';

// Note: In production, next-cloudinary's CldUploadWidget handles progress internally.
export default function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div 
        className="bg-indigo-500 h-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
