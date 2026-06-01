import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <h2 className="text-white font-medium">Loading CrowdCanvas...</h2>
      <p className="text-slate-400 text-sm mt-2">Preparing your workspace</p>
    </div>
  );
}
