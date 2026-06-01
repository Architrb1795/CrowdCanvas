import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <FileQuestion className="w-10 h-10 text-slate-400" />
          <div className="absolute -bottom-2 -right-2 bg-[#020617] p-1 rounded-full">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
              404
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or never existed.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          
          <Link
            href="/events"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
