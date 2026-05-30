'use client';

import React, { useState } from 'react';
import { Hand, Loader2, CheckCircle } from 'lucide-react';
import { createRoleRequest } from '@/lib/actions/role_requests';

interface RequestAccessButtonProps {
  eventId: string;
  hasPending: boolean;
}

export default function RequestAccessButton({ eventId, hasPending: initialHasPending }: RequestAccessButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPending, setHasPending] = useState(initialHasPending);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setIsSubmitting(true);
    setError('');
    
    const res = await createRoleRequest(eventId, 'uploader');
    
    if (res.success) {
      setHasPending(true);
    } else {
      setError(res.error || 'Failed to submit request.');
    }
    
    setIsSubmitting(false);
  };

  if (hasPending) {
    return (
      <button disabled className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm border border-indigo-200 opacity-80 cursor-not-allowed">
        <CheckCircle className="w-4 h-4 mr-2" />
        Request Pending
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button 
        onClick={handleRequest}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Hand className="w-4 h-4 mr-2" />}
        Request Upload Access
      </button>
      {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
    </div>
  );
}
