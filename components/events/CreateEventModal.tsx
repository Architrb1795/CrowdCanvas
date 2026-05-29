'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, FileText, Tag, Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createEvent } from '@/lib/actions/events';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('workshop');
  const [isPublic, setIsPublic] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: Focus the first input field when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 80);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Return null if modal is not open
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Client side validation
    if (!name || name.trim() === '') {
      setErrorMsg('Event name is required.');
      return;
    }
    if (name.length < 3) {
      setErrorMsg('Event name must be at least 3 characters.');
      return;
    }
    if (!eventDate) {
      setErrorMsg('Please select a valid date and time for the event.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('event_date', eventDate);
      formData.append('category', category);
      formData.append('is_public', String(isPublic));

      const response = await createEvent(null, formData);

      if (response.success) {
        setSuccessMsg('Event created successfully! Synchronizing platform...');
        
        // Reset states
        setName('');
        setDescription('');
        setEventDate('');
        setCategory('workshop');
        setIsPublic(true);

        // Close after success visual and refresh path
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        setErrorMsg(response.error || 'Failed to create event. Please check your permissions.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-slate-900">
              Create New Event
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure core parameters for club event discovery
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div 
              className="flex gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm font-semibold animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div 
              className="flex gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm font-semibold animate-fade-in"
              role="status"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="event-name" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              Event Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="event-name"
                ref={firstInputRef}
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Annual Cultural Night 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category selector */}
            <div className="space-y-1.5">
              <label htmlFor="event-category" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                Category
              </label>
              <select
                id="event-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-indigo-100"
              >
                <option value="workshop">Workshop / Academic</option>
                <option value="cultural">Cultural / Festival</option>
                <option value="sports">Sports / Outdoors</option>
                <option value="social">Social / Meetup</option>
                <option value="other">Other / Custom</option>
              </select>
            </div>

            {/* Event Date selector */}
            <div className="space-y-1.5">
              <label htmlFor="event-date-field" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Event Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="event-date-field"
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Description field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="event-description" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Description
              </label>
              <span className="text-xxs text-slate-400 font-semibold uppercase">
                {description.length}/500 chars
              </span>
            </div>
            <textarea
              id="event-description"
              maxLength={500}
              placeholder="Describe what members can expect, dress codes, guidelines, or schedules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium resize-none"
            />
          </div>

          {/* Visibility toggle option */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-950">Public Visibility</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[280px]">
                  {isPublic 
                    ? 'Everyone on campus can view this event and contribute media.' 
                    : 'Access is confined to authenticated organizers and approved club members.'
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isPublic ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
              role="switch"
              aria-checked={isPublic}
              aria-label="Toggle Public Visibility"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Footer Button Group */}
          <footer className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-75 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
