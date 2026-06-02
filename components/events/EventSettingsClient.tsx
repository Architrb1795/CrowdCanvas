'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Search, UserPlus, Shield, X, ShieldAlert, Star, Settings as SettingsIcon, AlertCircle, CheckCircle2, Calendar, FileText, Tag, Loader2, Key, Check, Droplets } from 'lucide-react';
import { EventMember, ProfileSearch, searchUsers, addEventMember, updateEventMemberRole, removeEventMember, transferOwnership, EventMemberRole } from '@/lib/actions/event_members';
import { updateEventDetails, updateEventWatermark } from '@/lib/actions/events';
import { resolveRoleRequest, RoleRequest } from '@/lib/actions/role_requests';
import { useRouter } from 'next/navigation';

interface EventSettingsClientProps {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any;
  initialMembers: EventMember[];
  initialRequests: RoleRequest[];
  currentUserRole: 'owner' | 'admin';
  currentUserId: string;
}

export default function EventSettingsClient({ eventId, event, initialMembers, initialRequests, currentUserRole, currentUserId }: EventSettingsClientProps) {
  const router = useRouter();
  const { confirm, alert } = useGlobalDialog();
  const [activeTab, setActiveTab] = useState('general');
  const [members, setMembers] = useState<EventMember[]>(initialMembers);
  const [requests, setRequests] = useState<RoleRequest[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // General Settings State
  const [name, setName] = useState(event.name || '');
  const [description, setDescription] = useState(event.description || '');
  const [eventDate, setEventDate] = useState(event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '');
  const [category, setCategory] = useState(event.category || 'workshop');
  const [isPublic, setIsPublic] = useState(event.is_public ?? true);
  
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');

  // Watermark Settings State
  const [watermarkEnabled, setWatermarkEnabled] = useState(event.watermark_enabled ?? false);
  const [watermarkText, setWatermarkText] = useState(event.watermark_text || '');
  const [watermarkStyle, setWatermarkStyle] = useState(event.watermark_style || 'bottom_right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(event.watermark_opacity ?? 50);
  const [watermarkSize, setWatermarkSize] = useState(event.watermark_size ?? 40);

  const [isSubmittingWatermark, setIsSubmittingWatermark] = useState(false);
  const [watermarkError, setWatermarkError] = useState('');
  const [watermarkSuccess, setWatermarkSuccess] = useState('');

  // Sync state with props on server refresh
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(event.name || '');
    setDescription(event.description || '');
    setEventDate(event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '');
    setCategory(event.category || 'workshop');
    setIsPublic(event.is_public ?? true);

    setWatermarkEnabled(event.watermark_enabled ?? false);
    setWatermarkText(event.watermark_text || '');
    setWatermarkStyle(event.watermark_style || 'bottom_right');
    setWatermarkOpacity(event.watermark_opacity ?? 50);
    setWatermarkSize(event.watermark_size ?? 40);
  }, [event]);

  const handleUpdateWatermark = async (e: React.FormEvent) => {
    e.preventDefault();
    setWatermarkError('');
    setWatermarkSuccess('');
    setIsSubmittingWatermark(true);

    const formData = new FormData();
    formData.append('watermark_enabled', String(watermarkEnabled));
    formData.append('watermark_text', watermarkText);
    formData.append('watermark_style', watermarkStyle);
    formData.append('watermark_opacity', String(watermarkOpacity));
    formData.append('watermark_size', String(watermarkSize));

    const res = await updateEventWatermark(eventId, formData);
    if (res.success) {
      setWatermarkSuccess('Watermark settings updated successfully.');
      router.refresh();
    } else {
      setWatermarkError(res.error || 'Failed to update watermark settings.');
    }
    setIsSubmittingWatermark(false);
  };

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');
    setIsSubmittingGeneral(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('event_date', eventDate);
    formData.append('category', category);
    formData.append('is_public', String(isPublic));

    const res = await updateEventDetails(eventId, formData);
    if (res.success) {
      setGeneralSuccess('Event details updated successfully.');
      router.refresh();
    } else {
      setGeneralError(res.error || 'Failed to update event details.');
    }
    setIsSubmittingGeneral(false);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const res = await searchUsers(query, eventId);
    if (res.success && res.data) {
      setSearchResults(res.data);
    }
    setIsSearching(false);
  };

  const handleAddMember = async (userId: string) => {
    setLoadingAction(`add-${userId}`);
    const res = await addEventMember(eventId, userId, 'viewer');
    if (res.success) {
      window.location.reload(); // Hard refresh to get updated server data
    } else {
      await alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleUpdateRole = async (userId: string, newRole: EventMemberRole) => {
    setLoadingAction(`update-${userId}`);
    const res = await updateEventMemberRole(eventId, userId, newRole);
    if (res.success) {
      setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    } else {
      await alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleRemoveMember = async (userId: string) => {
    const confirmed = await confirm('Are you sure you want to remove this user from the event?');
    if (!confirmed) return;
    
    setLoadingAction(`remove-${userId}`);
    const res = await removeEventMember(eventId, userId);
    if (res.success) {
      setMembers(members.filter(m => m.user_id !== userId));
    } else {
      await alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleTransferOwnership = async (userId: string) => {
    const confirmed = await confirm('WARNING: Are you sure you want to transfer ownership? You will be downgraded to an Admin.');
    if (!confirmed) return;
    
    setLoadingAction(`transfer-${userId}`);
    const res = await transferOwnership(eventId, userId);
    if (res.success) {
      window.location.reload();
    } else {
      await alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleResolveRequest = async (requestId: string, userId: string, requestedRole: EventMemberRole, action: 'approve' | 'reject') => {
    setLoadingAction(`resolve-${requestId}`);
    const res = await resolveRoleRequest(requestId, eventId, userId, requestedRole, action);
    if (res.success) {
      // Remove from list
      setRequests(requests.filter(r => r.id !== requestId));
      // If approved, refresh so the new member appears in the members list
      if (action === 'approve') {
        router.refresh();
      }
    } else {
      await alert(res.error);
    }
    setLoadingAction(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader 
        title={`${event.name} Settings`}
        subtitle="Manage event details, members, and visibility."
        align="left"
        badge={<Badge variant="gradient">Event Configuration</Badge>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex items-center gap-2 p-1 bg-slate-900 border border-white/5 rounded-xl max-w-fit">
          <TabsTrigger value="general" className="flex items-center gap-2 px-4 py-2 text-sm">
            <SettingsIcon className="w-4 h-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 px-4 py-2 text-sm">
            <Shield className="w-4 h-4" />
            Member Management
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2 px-4 py-2 text-sm relative">
            <Key className="w-4 h-4" />
            Access Requests
            {requests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-slate-900">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="watermark" className="flex items-center gap-2 px-4 py-2 text-sm">
            <Droplets className="w-4 h-4" />
            Watermarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="max-w-3xl p-6 border-white/5 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-indigo-400" />
                Event Details
              </h3>
              <p className="text-sm text-slate-400 mt-1">Update core parameters for the event.</p>
            </div>

            <form onSubmit={handleUpdateGeneral} className="space-y-5">
              {generalError && (
                <div className="flex gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}
              {generalSuccess && (
                <div className="flex gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{generalSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="event-name" className="text-sm font-bold text-slate-300">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="event-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="event-category" className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-slate-400" />
                    Category
                  </label>
                  <select
                    id="event-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                  >
                    <option value="workshop">Workshop / Academic</option>
                    <option value="cultural">Cultural / Festival</option>
                    <option value="sports">Sports / Outdoors</option>
                    <option value="social">Social / Meetup</option>
                    <option value="other">Other / Custom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-date" className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="event-date"
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event-description" className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Public Visibility</h4>
                    <p className="text-xs text-slate-400 max-w-[280px]">
                      {isPublic 
                        ? 'Everyone on campus can view this event.' 
                        : 'Access is confined to authenticated organizers and approved club members.'
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPublic ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isPublic}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button type="submit" disabled={isSubmittingGeneral}>
                  {isSubmittingGeneral ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Member List */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="p-0 border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Event Members
                  </h3>
                  <Badge variant="outline">{members.length} Total</Badge>
                </div>
                
                <div className="divide-y divide-white/5">
                  {members.map(member => (
                    <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          {member.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {member.profiles?.full_name || 'Unknown User'}
                            {member.user_id === currentUserId && <Badge variant="outline" className="text-[10px] py-0 h-4">You</Badge>}
                          </div>
                          <div className="text-xs text-slate-400">{member.profiles?.email || 'No email provided'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {member.role === 'owner' ? (
                          <Badge variant="gradient" className="gap-1 bg-amber-500/20 text-amber-300 border-amber-500/30">
                            <Star className="w-3 h-3" />
                            Owner
                          </Badge>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value as EventMemberRole)}
                            disabled={loadingAction === `update-${member.user_id}` || currentUserRole !== 'owner'}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          >
                            <option value="admin">Admin</option>
                            <option value="uploader">Uploader</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}

                        {member.role !== 'owner' && (
                          <div className="flex items-center gap-2">
                            {currentUserRole === 'owner' && (
                              <button
                                onClick={() => handleTransferOwnership(member.user_id)}
                                disabled={loadingAction === `transfer-${member.user_id}`}
                                className="p-1.5 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                                title="Transfer Ownership"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={loadingAction === `remove-${member.user_id}`}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column: Add Members */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 space-y-6 border-white/5">
                <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Invite Members
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                    />
                  </div>

                  {isSearching && <div className="text-xs text-slate-400 text-center py-4">Searching...</div>}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-colors">
                          <div className="truncate pr-3">
                            <div className="text-sm font-semibold text-white truncate">{user.full_name}</div>
                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAddMember(user.id)}
                            disabled={loadingAction === `add-${user.id}`}
                            className="h-8 shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="text-xs text-slate-500 text-center py-4">No users found matching &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="max-w-3xl p-0 border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  Pending Access Requests
                </h3>
                <p className="text-sm text-slate-400">Review and approve requests for upload access.</p>
              </div>
              <Badge variant="outline">{requests.length} Pending</Badge>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 mb-3 text-slate-700" />
                <p>No pending access requests.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {requests.map(request => (
                  <div key={request.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        {request.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{request.profiles?.full_name || 'Unknown User'}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          {request.profiles?.email} 
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-600 mx-1"></span>
                          Requested <span className="font-semibold text-indigo-400 capitalize">{request.requested_role}</span> access
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResolveRequest(request.id, request.user_id, request.requested_role, 'reject')}
                        disabled={loadingAction === `resolve-${request.id}`}
                        className="bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border-0"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveRequest(request.id, request.user_id, request.requested_role, 'approve')}
                        disabled={loadingAction === `resolve-${request.id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="watermark">
          <Card className="max-w-3xl p-6 border-white/5 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-indigo-400" />
                Dynamic Watermarks
              </h3>
              <p className="text-sm text-slate-400 mt-1">Configure intelligent watermarking to protect your event media.</p>
            </div>

            <form onSubmit={handleUpdateWatermark} className="space-y-6">
              {watermarkError && (
                <div className="flex gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{watermarkError}</span>
                </div>
              )}
              {watermarkSuccess && (
                <div className="flex gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{watermarkSuccess}</span>
                </div>
              )}

              <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Enable Watermarking</h4>
                    <p className="text-xs text-slate-400 max-w-[320px]">
                      Automatically apply watermarks when users download media. Owners and admins get smaller watermarks, while viewers get larger ones.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    watermarkEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={watermarkEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      watermarkEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {watermarkEnabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label htmlFor="watermark-text" className="text-sm font-bold text-slate-300">
                      Watermark Text
                    </label>
                    <input
                      id="watermark-text"
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CrowdCanvas, {username}"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Use <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">{"{username}"}</code> to dynamically insert the downloader&apos;s name.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="watermark-style" className="text-sm font-bold text-slate-300">
                      Watermark Style
                    </label>
                    <select
                      id="watermark-style"
                      value={watermarkStyle}
                      onChange={(e) => setWatermarkStyle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 outline-none"
                    >
                      <option value="bottom_right">Bottom Right Corner</option>
                      <option value="badge">Bottom Left Badge</option>
                      <option value="diagonal">Large Diagonal</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm font-bold text-slate-300">Opacity</label>
                        <span className="text-xs text-slate-400">{watermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm font-bold text-slate-300">Base Size</label>
                        <span className="text-xs text-slate-400">{watermarkSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button type="submit" disabled={isSubmittingWatermark}>
                  {isSubmittingWatermark ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Watermark Settings'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
