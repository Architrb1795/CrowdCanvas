'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Camera, AlertCircle, Loader2, Crop as CropIcon } from 'lucide-react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { extractFaceServerSide } from '@/lib/actions/faces';

interface SelfieCaptureProps {
  onCapture: (embedding: number[]) => void;
  isProcessing?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function SelfieCapture({ onCapture, isProcessing = false }: SelfieCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsCropping(true); // Default to cropping mode when a photo is selected
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 3 / 4));
  };

  const getCroppedImgBase64 = (): string | null => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const processImage = async () => {
    setExtracting(true);
    setError(null);

    try {
      let finalBase64: string | null = null;
      
      // If we're cropping, get the cropped portion. Otherwise, use the original image
      if (isCropping && completedCrop) {
        finalBase64 = getCroppedImgBase64();
      } 
      
      if (!finalBase64) {
        // Fallback to the original image base64 if crop fails or we skipped cropping
        // but we already have previewUrl
        const response = await fetch(previewUrl!);
        const blob = await response.blob();
        finalBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      if (!finalBase64) throw new Error("Failed to process image data");

      const result = await extractFaceServerSide(finalBase64);
      
      if (!result.success || !result.embedding) {
        setError(result.error || 'Failed to detect face. Please try another photo or ensure your face is clearly visible.');
        setExtracting(false);
        return;
      }

      // Cleanup preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      onCapture(result.embedding);
    } catch (err) {
      console.error('Face extraction error:', err);
      setError('An error occurred while processing the image. Please try again.');
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!previewUrl ? (
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors"
            variant="outline"
            disabled={isProcessing}
          >
            <Camera className="w-8 h-8 text-slate-400" />
            <span className="text-slate-300 font-medium">Take Selfie or Upload Photo</span>
          </Button>
          <p className="text-xs text-center text-slate-500">
            For best results: Look straight at the camera, ensure good lighting, and remove sunglasses or heavy accessories.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-indigo-500/30 bg-black/50 flex flex-col items-center justify-center min-h-[300px]">
            {isCropping ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={3 / 4}
                className="max-h-[60vh]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={previewUrl}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={previewUrl} 
                alt="Selfie preview" 
                className="max-h-[60vh] object-contain"
              />
            )}
            
            {/* Scanning overlay effect */}
            {extracting && (
              <div className="absolute inset-0 bg-indigo-500/20 z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-scan" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              disabled={extracting || isProcessing}
              onClick={() => {
                setPreviewUrl(null);
                setCrop(undefined);
                setCompletedCrop(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Retake
            </Button>
            
            <Button
              type="button"
              variant={isCropping ? "primary" : "outline"}
              className="flex-none px-3"
              disabled={extracting || isProcessing}
              onClick={() => setIsCropping(!isCropping)}
              title="Crop image"
            >
              <CropIcon className="w-4 h-4" />
            </Button>

            <Button 
              type="button" 
              className="flex-1"
              disabled={extracting || isProcessing || (isCropping && !completedCrop?.width)}
              onClick={processImage}
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Use This Photo'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
