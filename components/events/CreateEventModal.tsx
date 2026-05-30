'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Calendar, FileText, Tag, Shield, Loader2, AlertCircle, CheckCircle2, MapPin, Image as ImageIcon, Search, UserPlus } from 'lucide-react';
import { createEvent } from '@/lib/actions/events';
import { searchUsers, ProfileSearch } from '@/lib/actions/event_members';
import { Button } from '@/components/ui/Button';

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
  const [location, setLocation] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const [initialMembers, setInitialMembers] = useState<ProfileSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const res = await searchUsers(query);
    if (res.success && res.data) {
      // Filter out those already added
      const filtered = res.data.filter(u => !initialMembers.some(m => m.id === u.id));
      setSearchResults(filtered);
    }
    setIsSearching(false);
  };

  const addInitialMember = (user: ProfileSearch) => {
    setInitialMembers([...initialMembers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInitialMember = (userId: string) => {
    setInitialMembers(initialMembers.filter(m => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
      formData.append('location', location);
      formData.append('cover_url', coverUrl);
      formData.append('is_public', String(isPublic));
      
      if (!isPublic && initialMembers.length > 0) {
        const memberIds = initialMembers.map(m => m.id);
        formData.append('initial_members', JSON.stringify(memberIds));
      }

      const response = await createEvent(null, formData);

      if (response.success) {
        setSuccessMsg('Event created successfully! Synchronizing platform...');
        
        setName('');
        setDescription('');
        setEventDate('');
        setCategory('workshop');
        setLocation('');
        setCoverUrl('');
        setIsPublic(true);
        setInitialMembers([]);

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

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex gap-2.5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm font-semibold animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Core Details</h3>
            
            <div className="space-y-1.5">
              <label htmlFor="event-name" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                Event Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="event-name"
                ref={firstInputRef}
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Annual Cultural Night 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="event-category" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-400" />
                  Category
                </label>
                <select
                  id="event-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="workshop">Workshop / Academic</option>
                  <option value="cultural">Cultural / Festival</option>
                  <option value="sports">Sports / Outdoors</option>
                  <option value="social">Social / Meetup</option>
                  <option value="other">Other / Custom</option>
                </select>
              </div>

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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="event-location" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Location <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="event-location"
                type="text"
                placeholder="e.g. Main Auditorium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Media & Presentation */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Presentation</h3>
            
            <div className="space-y-1.5">
              <label htmlFor="event-cover" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Cover Image URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="event-cover"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              />
            </div>

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
                placeholder="Describe what members can expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>

          {/* Access & Visibility */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Access Control</h3>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Public Visibility</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[300px]">
                    {isPublic 
                      ? 'Everyone on campus can view this event and its media.' 
                      : 'Access is confined to authenticated organizers and explicitly invited members.'
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
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Invite Initial Members if Private */}
            {!isPublic && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <UserPlus className="w-4 h-4 text-indigo-500" />
                  Pre-approve Members
                </div>
                <p className="text-xs text-slate-500">
                  Select users who will instantly gain access to this private event upon creation.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm outline-none"
                    />
                  </div>

                  {isSearching && <div className="text-xs text-slate-400 text-center py-2">Searching...</div>}

                  {searchResults.length > 0 && (
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 p-1 border border-slate-100 rounded-lg bg-white">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                          <div className="truncate pr-2">
                            <div className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => addInitialMember(user)} className="h-7 px-3 text-xs">
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {initialMembers.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Selected ({initialMembers.length}):</div>
                      <div className="flex flex-wrap gap-2">
                        {initialMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            {member.full_name}
                            <button type="button" onClick={() => removeInitialMember(member.id)} className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-75 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
