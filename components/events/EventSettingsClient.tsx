'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, Shield, X, MoreVertical, ShieldAlert, Star } from 'lucide-react';
import { EventMember, ProfileSearch, searchUsers, addEventMember, updateEventMemberRole, removeEventMember, transferOwnership, EventMemberRole } from '@/lib/actions/event_members';

interface EventSettingsClientProps {
  eventId: string;
  eventName: string;
  initialMembers: EventMember[];
  currentUserRole: 'owner' | 'admin';
  currentUserId: string;
}

export default function EventSettingsClient({ eventId, eventName, initialMembers, currentUserRole, currentUserId }: EventSettingsClientProps) {
  const [members, setMembers] = useState<EventMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
      alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleUpdateRole = async (userId: string, newRole: EventMemberRole) => {
    setLoadingAction(`update-${userId}`);
    const res = await updateEventMemberRole(eventId, userId, newRole);
    if (res.success) {
      setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    } else {
      alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the event?')) return;
    
    setLoadingAction(`remove-${userId}`);
    const res = await removeEventMember(eventId, userId);
    if (res.success) {
      setMembers(members.filter(m => m.user_id !== userId));
    } else {
      alert(res.error);
    }
    setLoadingAction(null);
  };

  const handleTransferOwnership = async (userId: string) => {
    if (!confirm('WARNING: Are you sure you want to transfer ownership? You will be downgraded to an Admin.')) return;
    
    setLoadingAction(`transfer-${userId}`);
    const res = await transferOwnership(eventId, userId);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoadingAction(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader 
        title={`${eventName} Settings`}
        subtitle="Manage event members, uploaders, and visibility."
        align="left"
        badge={<Badge variant="gradient">Access Control</Badge>}
      />

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
                <div className="text-xs text-slate-500 text-center py-4">No users found matching "{searchQuery}"</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
