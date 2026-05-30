'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminDiagnosticsPanel({ mediaItems }: { mediaItems: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-rose-500/10 text-rose-700 font-mono text-sm hover:bg-rose-500/20 transition-colors"
      >
        <span className="flex items-center gap-2 font-bold">
          <Terminal className="w-4 h-4" />
          Developer Diagnostics [DEBUG MODE]
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-700">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-2 rounded-tl-lg">Media ID</th>
                <th className="px-4 py-2">Event ID</th>
                <th className="px-4 py-2">Uploader ID</th>
                <th className="px-4 py-2">Cloudinary Public ID</th>
                <th className="px-4 py-2 rounded-tr-lg">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mediaItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 max-w-[120px] truncate" title={item.id}>{item.id}</td>
                  <td className="px-4 py-3 max-w-[120px] truncate" title={item.event_id}>{item.event_id}</td>
                  <td className="px-4 py-3 max-w-[120px] truncate" title={item.uploaded_by}>{item.uploaded_by}</td>
                  <td className="px-4 py-3 max-w-[150px] truncate" title={item.cloudinary_public_id}>{item.cloudinary_public_id || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.is_private ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.is_private ? 'PRIVATE' : 'PUBLIC'}
                    </span>
                  </td>
                </tr>
              ))}
              {mediaItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-500 italic">No media items found in current query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
