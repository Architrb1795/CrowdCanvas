'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Shield, EyeOff, CheckCircle } from 'lucide-react';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

export default function PrivacySettingsForm() {
  const [settings, setSettings] = useState({
    hide_tagged_photos: false,
    require_tag_approval: true,
    disable_tagging: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { alert } = useGlobalDialog();

  useEffect(() => {
    async function fetchSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        setSettings({
          hide_tagged_photos: data.hide_tagged_photos,
          require_tag_approval: data.require_tag_approval,
          disable_tagging: data.disable_tagging
        });
      }
      setLoading(false);
    }
    fetchSettings();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('user_privacy_settings')
      .update(settings)
      .eq('user_id', session.user.id);

    setSaving(false);
    if (error) {
      alert('Failed to update privacy settings.');
    } else {
      alert('Privacy settings updated successfully.');
    }
  };

  if (loading) return <div className="text-slate-400">Loading privacy settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/50">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">Require Tag Approval</h4>
          <p className="text-sm text-slate-400 mb-3">When someone tags you, require your explicit approval before the tag becomes visible to others.</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.require_tag_approval}
              onChange={(e) => setSettings({...settings, require_tag_approval: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/50">
        <div className="p-2 bg-slate-500/20 text-slate-400 rounded-lg shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">Disable Tagging</h4>
          <p className="text-sm text-slate-400 mb-3">Prevent other users from tagging you in photos altogether.</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.disable_tagging}
              onChange={(e) => setSettings({...settings, disable_tagging: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/50">
        <div className="p-2 bg-slate-500/20 text-slate-400 rounded-lg shrink-0">
          <EyeOff className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">Hide Photos of Me</h4>
          <p className="text-sm text-slate-400 mb-3">Keep photos you are tagged in hidden from your public profile.</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.hide_tagged_photos}
              onChange={(e) => setSettings({...settings, hide_tagged_photos: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>

      <Button variant="gradient" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Privacy Settings'}
      </Button>
    </div>
  );
}
