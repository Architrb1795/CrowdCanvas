'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Button } from '@/components/ui/Button';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface SelfieCaptureProps {
  onCapture: (embedding: number[]) => void;
  isProcessing?: boolean;
}

export function SelfieCapture({ onCapture, isProcessing = false }: SelfieCaptureProps) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load facial recognition models. Please check your connection.');
      }
    }
    loadModels();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setExtracting(true);
  };

  const processImage = async () => {
    if (!imageRef.current || !modelsLoaded) return;

    try {
      // Extract face descriptor
      const detection = await faceapi.detectSingleFace(imageRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please ensure your face is clearly visible, well-lit, and directly facing the camera.');
        setExtracting(false);
        return;
      }

      // Convert Float32Array to standard array
      const embedding = Array.from(detection.descriptor);
      
      // Cleanup preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      onCapture(embedding);
      
    } catch (err) {
      console.error('Face extraction error:', err);
      setError('An error occurred while processing the image. Please try again.');
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!modelsLoaded ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-white/5 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading AI models (this happens securely in your browser)...</p>
        </div>
      ) : (
        <>
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
              <div className="relative aspect-square max-w-sm mx-auto overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  ref={imageRef}
                  src={previewUrl} 
                  alt="Selfie preview" 
                  className="w-full h-full object-cover"
                  onLoad={processImage}
                />
                
                {(extracting || isProcessing) && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-medium text-white">
                      {isProcessing ? 'Saving secure profile...' : 'Analyzing facial features...'}
                    </p>
                    <p className="text-xs text-slate-400 text-center px-4">
                      Extracting 128 mathematical points.<br/>The photo itself is never sent to our servers.
                    </p>
                  </div>
                )}
              </div>
              
              {!extracting && !isProcessing && error && (
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPreviewUrl(null);
                      setError(null);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
