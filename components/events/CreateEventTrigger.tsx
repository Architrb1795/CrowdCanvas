'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateEventModal from './CreateEventModal';

export default function CreateEventTrigger({ className, children }: { className?: string, children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {children || (
          <>
            <Plus className="w-4.5 h-4.5" />
            Create Event
          </>
        )}
      </button>

      <CreateEventModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
