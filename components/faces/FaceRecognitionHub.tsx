'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScanFace, Trash2, Camera, ShieldCheck, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const SelfieCapture = dynamic(
  () => import('./SelfieCapture').then((mod) => mod.SelfieCapture),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
  }
);
import { createFaceProfile, deleteFaceProfile, getFaceStats, scanHistoricalFaces } from '@/lib/actions/faces';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface FaceProfile {
  id: string;
  consent_given: boolean;
}

interface FaceRecognitionHubProps {
  initialProfile: FaceProfile | null;
}

export function FaceRecognitionHub({ initialProfile }: FaceRecognitionHubProps) {
  const [profile, setProfile] = useState<FaceProfile | null>(initialProfile);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadStats = async () => {
    const data = await getFaceStats();
    if (data) setStats(data);
  };

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadStats();
    }
  }, [profile]);

  const handleRefresh = async () => {
    setIsProcessing(true);
    setError(null);
    const result = await scanHistoricalFaces();
    if (result.success) {
      await loadStats();
    } else {
      setError(result.error || 'Failed to refresh matches');
    }
    setIsProcessing(false);
  };

  const handleCapture = async (embedding: number[]) => {
    setIsProcessing(true);
    setError(null);
    
    const result = await createFaceProfile(embedding, consentGiven);
    
    setIsProcessing(false);
    
    if (result.success) {
      // Refresh profile state
      setProfile({ id: 'new', consent_given: true });
      setIsConfiguring(false);
    } else {
      setError(result.error || 'Failed to save face profile');
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    const result = await deleteFaceProfile();
    setIsProcessing(false);
    setIsDeleteDialogOpen(false);
    
    if (result.success) {
      setProfile(null);
      setStats(null);
    } else {
      setError(result.error || 'Failed to delete profile');
    }
  };

  if (!profile && !isConfiguring) {
    return (
      <Card className="p-6 border-white/5 bg-gradient-to-br from-slate-900 to-indigo-950/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
            <ScanFace className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white">Face Recognition Hub</h3>
            <p className="text-sm text-slate-400 mt-1">
              Upload a selfie to instantly discover every event photo containing your face. 
              Say goodbye to manually searching through thousands of images.
            </p>
          </div>
          <Button 
            onClick={() => setIsConfiguring(true)}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            <Camera className="w-4 h-4 mr-2" />
            Set Up Now
          </Button>
        </div>
      </Card>
    );
  }

  if (isConfiguring && !profile) {
    return (
      <Card className="p-6 border-white/5 bg-slate-900 space-y-6">
        <div className="border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-400" />
            Setup Face Recognition
          </h3>
          <p className="text-sm text-slate-400 mt-1">Create your secure facial profile to enable instant photo discovery.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Privacy & Consent
          </h4>
          <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
            <li>Your selfie is securely processed on our servers to guarantee the highest matching accuracy across the dataset.</li>
            <li>We extract a mathematical representation (128 points) and immediately discard the photo.</li>
            <li>This mathematical profile is used solely to match you with event photos.</li>
            <li>You can delete your profile and all associated data at any time.</li>
          </ul>
          
          <label className="flex items-start gap-3 mt-4 cursor-pointer group">
            <div className="mt-1 flex items-center h-5">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
              />
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-300 group-hover:text-white transition-colors">I consent to the processing of my facial data</span>
              <p className="text-slate-500 text-xs mt-0.5">By checking this box, you agree to the terms outlined above.</p>
            </div>
          </label>
        </div>

        {consentGiven && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SelfieCapture onCapture={handleCapture} isProcessing={isProcessing} />
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setIsConfiguring(false)} disabled={isProcessing}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  // Active Profile State
  return (
    <Card className="p-6 border-white/5 bg-slate-900 space-y-6">
      <div className="flex items-start justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-emerald-400" />
            Face Recognition Active
          </h3>
          <p className="text-sm text-slate-400 mt-1">Your facial profile is actively scanning event media.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isProcessing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Rescan
          </Button>
          <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={isProcessing}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
          <div className="mt-2 flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            Scanning Active
          </div>
        </div>
        
        <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Photos Found</p>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.photosFound : '-'}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Events Matched</p>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.eventsFound : '-'}
          </div>
        </div>
      </div>
      
      {stats && stats.photosFound > 0 && (
        <div className="pt-4 flex justify-center">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
            onClick={() => window.location.href = '/my-photos'}
          >
            View My Photos Gallery
          </Button>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Face Profile"
        description="Are you sure you want to delete your face profile? This will remove all your personalized photo matches. Your historical photos will remain in the events, but you will no longer be tagged in them."
        confirmText="Delete Profile"
        isDestructive={true}
        isLoading={isProcessing}
      />
    </Card>
  );
}
