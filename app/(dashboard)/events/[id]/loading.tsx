import { Loader2 } from 'lucide-react';

export default function EventDashboardLoading() {
  return (
    <div className="flex-1 p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-slate-800 rounded-lg" />
          <div className="h-5 w-96 bg-slate-800/50 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-slate-800 rounded-lg" />
          <div className="h-10 w-32 bg-indigo-900/30 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-6 border-b border-white/10 pb-2">
        <div className="h-6 w-20 bg-slate-800 rounded" />
        <div className="h-6 w-24 bg-slate-800/50 rounded" />
        <div className="h-6 w-20 bg-slate-800/50 rounded" />
      </div>

      {/* Gallery Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
