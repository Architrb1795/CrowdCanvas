'use client';

import React, { useState } from 'react';
import { UserProfileData, UserUploadData, UserEventData, updateProfile, deleteUserUpload } from '@/lib/actions/profile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { User, Image as ImageIcon, Calendar, Settings, CheckCircle, Download, Trash2, ShieldAlert } from 'lucide-react';
import AvatarUpload from '@/components/profile/AvatarUpload';
import FutureHooks from '@/components/profile/FutureHooks';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, BrainCircuit, Bookmark, Tag } from 'lucide-react';
import { FaceRecognitionHub } from '@/components/faces/FaceRecognitionHub';
import PrivacySettingsForm from '@/components/profile/PrivacySettingsForm';

interface ProfileDashboardClientProps {
  profile: UserProfileData;
  uploads: UserUploadData[];
  events: UserEventData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faceProfile: any;
}

export default function ProfileDashboardClient({ profile, uploads, events, faceProfile }: ProfileDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { confirm, alert } = useGlobalDialog();
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.full_name || '');
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await updateProfile({ full_name: editName, bio: editBio });
    if (res.success) {
      setIsEditing(false);
      window.location.reload();
    } else {
      await alert(res.error || 'Failed to save profile');
    }
    setIsSaving(false);
  };

  const handleDeleteUpload = async (mediaId: string) => {
    const confirmed = await confirm('Are you sure you want to delete this media?');
    if (!confirmed) return;
    const res = await deleteUserUpload(mediaId);
    if (res.success) {
      window.location.reload();
    } else {
      await alert(res.error || 'Failed to delete upload');
    }
  };

  const handleDownload = async (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Profile Snippet */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
        
        <AvatarUpload 
          currentAvatarUrl={profile.avatar_url} 
          fullName={profile.full_name || 'User'} 
          size="lg"
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.full_name || 'Unnamed User'}</h1>
            {profile.role === 'admin' && <Badge variant="gradient">Admin</Badge>}
          </div>
          <p className="text-slate-400 font-medium">{profile.email}</p>
          {profile.bio && (
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="flex gap-4 md:flex-col md:gap-2 justify-center">
          <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-black text-white">{profile.stats.eventsJoined}</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">Events</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-black text-white">{profile.stats.mediaUploaded}</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">Uploads</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-white/5 p-1 flex overflow-x-auto custom-scrollbar gap-1 rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 text-sm">
            <User className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 px-4 py-2 text-sm">
            <Calendar className="w-4 h-4" /> My Events
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2 px-4 py-2 text-sm">
            <ImageIcon className="w-4 h-4" /> My Uploads
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 px-4 py-2 text-sm">
            <Settings className="w-4 h-4" /> Account Settings
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-400">
            <CheckCircle className="w-4 h-4" /> Activity Feed (Beta)
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="mb-8">
              <FaceRecognitionHub initialProfile={faceProfile} />
            </div>

            <SectionHeader title="Dashboard Overview" subtitle="A summary of your activity across CrowdCanvas." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border-white/5 hover:border-indigo-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Events Managed</h3>
                    <p className="text-sm text-slate-400">Events you own or admin</p>
                  </div>
                </div>
                <div className="text-4xl font-black text-white">{profile.stats.eventsManaged}</div>
              </Card>

              <Card className="p-6 border-white/5 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform"><ImageIcon className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Total Uploads</h3>
                    <p className="text-sm text-slate-400">Photos and videos</p>
                  </div>
                </div>
                <div className="text-4xl font-black text-white">{profile.stats.mediaUploaded}</div>
              </Card>

              <Card className="p-6 border-white/5 hover:border-amber-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform"><User className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Account Age</h3>
                    <p className="text-sm text-slate-400">Since joined</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-white">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </Card>

              <Link href="/profile/favourites">
                <Card className="p-6 border-white/5 hover:border-amber-500/30 transition-colors group h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform"><Bookmark className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">My Favourites</h3>
                      <p className="text-sm text-slate-400">Photos you saved</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/profile/tags">
                <Card className="p-6 border-white/5 hover:border-blue-500/30 transition-colors group h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl group-hover:scale-110 transition-transform"><Tag className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Photos of Me</h3>
                      <p className="text-sm text-slate-400">Tagged & matched photos</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            <SectionHeader title="Intelligence Hub" subtitle="Explore your AI profile and platform analytics." className="mt-12" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/profile/insights" className="block">
                <Card className="p-6 border-white/5 hover:border-amber-500/30 transition-all hover:bg-slate-900/80 group h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">AI Insights</h3>
                      <p className="text-sm text-slate-400 mt-1">View your personalized AI profile and engagement interests.</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {profile.role === 'admin' && (
                <Link href="/admin/personalization" className="block">
                  <Card className="p-6 border-white/5 hover:border-purple-500/30 transition-all hover:bg-slate-900/80 group h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                        <BrainCircuit className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Personalization Engine</h3>
                        <p className="text-sm text-slate-400 mt-1">Admin dashboard for global recommendation metrics.</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
            </div>

            <div className="mt-12">
              <FutureHooks />
            </div>
          </TabsContent>

          {/* MY EVENTS TAB */}
          <TabsContent value="events" className="space-y-6">
            <SectionHeader title="My Events" subtitle="Events you are a member of." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Events Yet</h3>
                  <p className="text-slate-400 max-w-sm mb-6">
                    You haven&apos;t joined or created any events. Discover public events or create your own!
                  </p>
                  <Button variant="gradient" onClick={() => window.location.href = '/events'}>
                    Browse Events
                  </Button>
                </div>
              ) : (
                events.map(event => (
                  <Card key={event.event_id} className="p-0 overflow-hidden border-white/5 flex flex-col hover:border-indigo-500/30 transition-colors">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant={event.role === 'owner' || event.role === 'admin' ? 'gradient' : 'outline'}>
                          {event.role.charAt(0).toUpperCase() + event.role.slice(1)}
                        </Badge>
                        {!event.events?.is_public && <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Private</Badge>}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{event.events?.name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {event.events?.event_date ? new Date(event.events.event_date).toLocaleDateString('en-US') : 'TBA'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-900/50 border-t border-white/5 flex justify-end gap-2">
                      {(event.role === 'owner' || event.role === 'admin') && (
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = `/events/${event.event_id}/settings`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = `/media?eventId=${event.event_id}`}>View Event</Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* MY UPLOADS TAB */}
          <TabsContent value="uploads" className="space-y-6">
            <SectionHeader title="My Uploads" subtitle="Manage media you have contributed to events." />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploads.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Uploads Yet</h3>
                  <p className="text-slate-400 max-w-sm">
                    You haven&apos;t contributed any media to events yet. Your uploads will appear here.
                  </p>
                </div>
              ) : (
                uploads.map(media => (
                  <div key={media.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                    <Image
                      src={media.thumbnail_url || media.file_url}
                      alt="Upload"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-xs text-white font-medium truncate mb-2">{media.events?.name}</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-8 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md" onClick={() => handleDownload(media.file_url)}>
                          <Download className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-100 border-red-500/30 backdrop-blur-md" onClick={() => handleDeleteUpload(media.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <SectionHeader title="Account Settings" subtitle="Update your personal information." />
            
            <Card className="p-6 md:p-8 border-white/5 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="text"
                    value={profile.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-2">Email address cannot be changed currently.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Biography (Optional)</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 custom-scrollbar resize-none"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3">
                  {isEditing ? (
                    <>
                      <Button variant="gradient" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setIsEditing(false); setEditName(profile.full_name || ''); setEditBio(profile.bio || ''); }} disabled={isSaving}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <SectionHeader title="Privacy & Tags" subtitle="Manage how others interact with you." className="mt-12" />
            <Card className="p-6 md:p-8 border-white/5 max-w-2xl">
              <PrivacySettingsForm />
            </Card>

            <SectionHeader title="Danger Zone" subtitle="Irreversible account actions." className="mt-12" />
            <Card className="p-6 border-red-500/20 bg-red-950/10 max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-white font-bold mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-400" /> Delete Account</h4>
                <p className="text-sm text-slate-400">Permanently remove your account and all associated data.</p>
              </div>
              <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10 whitespace-nowrap" onClick={() => alert('Feature disabled for safety.')}>
                Delete Account
              </Button>
            </Card>
          </TabsContent>

          {/* ACTIVITY TAB (Placeholder) */}
          <TabsContent value="activity" className="space-y-6">
             <SectionHeader title="Activity Feed" subtitle="See what's happening around you." />
             <FutureHooks />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
