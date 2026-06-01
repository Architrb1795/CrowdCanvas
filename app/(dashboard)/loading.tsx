import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-slate-200 font-medium">Loading Dashboard...</h2>
      </div>
    </div>
  );
}
