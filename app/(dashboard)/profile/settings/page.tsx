'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Trash2, Smartphone, Monitor, Shield, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
        setUsername(user.user_metadata?.username || '');
      }
    };
    fetchUser();
  }, [supabase.auth]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, username }
    });

    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
      // Update custom profiles table if needed via an RPC or API, 
      // but the trigger handles creation. Let's assume metadata is main source of truth for now.
    }
    setProfileLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters' });
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
      setNewPassword('');
    }
    setPasswordLoading(false);
  };

  const handleSignOutAll = async () => {
    // Supabase JS doesn't have a direct "sign out all other devices" in v2 client-side easily without admin rights,
    // but we can update the user's password or call a custom RPC.
    // For now, we simulate this feature as it's a UI placeholder pending backend RPC.
    alert('This feature requires the user_sessions backend implementation to be finalized.');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? Your media will be preserved but anonymized.')) return;
    setDeleteLoading(true);

    // Call soft delete API route
    const res = await fetch('/api/user/delete', { method: 'POST' });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push('/login');
    } else {
      alert('Failed to delete account');
      setDeleteLoading(false);
    }
  };

  if (!user) return <div className="p-8"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your profile, security, and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Shield className="w-5 h-5" />
              <span>Security</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-8">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Public Profile</h3>
                  <p className="text-sm text-slate-500">This information will be displayed publicly.</p>
                </div>
                
                {profileMsg.text && (
                  <div className={`p-4 rounded-xl flex items-center ${profileMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {profileMsg.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input 
                      type="text" 
                      disabled 
                      value={user.email} 
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">To change your email, please contact support.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={profileLoading}
                    className="flex items-center justify-center w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </button>
                </form>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Password Form */}
                <section>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
                    <p className="text-sm text-slate-500">Update your password associated with this account.</p>
                  </div>

                  {passwordMsg.text && (
                    <div className={`mt-4 p-4 rounded-xl flex items-center ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {passwordMsg.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                      {passwordMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={passwordLoading || !newPassword}
                      className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                    </button>
                  </form>
                </section>

                <hr className="border-slate-200" />

                {/* Sessions */}
                <section>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Active Sessions</h3>
                    <p className="text-sm text-slate-500">Manage the devices you are currently logged in on.</p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <div className="flex items-center space-x-4">
                        <Monitor className="w-8 h-8 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Mac OS • Chrome</p>
                          <p className="text-xs text-emerald-600 font-medium">Active now (This device)</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <Smartphone className="w-8 h-8 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">iOS • Safari</p>
                          <p className="text-xs text-slate-500">Last active: 2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSignOutAll} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Sign out of all other devices
                  </button>
                </section>

                <hr className="border-slate-200" />

                {/* Danger Zone */}
                <section>
                  <div>
                    <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                    <p className="text-sm text-slate-500">Permanently remove your personal data from CrowdCanvas.</p>
                  </div>
                  <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-xl">
                    <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                    <p className="text-xs text-red-700 mt-1 mb-4">
                      Your personal data will be anonymized. Photos uploaded to events will remain to preserve event integrity. This action cannot be undone.
                    </p>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete My Account
                    </button>
                  </div>
                </section>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
