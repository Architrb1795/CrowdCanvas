'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Loader2, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Basic password strength validation
  const isPasswordStrong = (pass: string) => pass.length >= 8;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!isPasswordStrong(password)) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      
      // Log security notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'security_alert',
        });
      }

      setTimeout(() => {
        router.push('/events');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600 blur-[120px] mix-blend-screen animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600 blur-[120px] mix-blend-screen" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 sm:p-10 shadow-2xl">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create New Password</h2>
            <p className="text-sm text-slate-400">
              Please enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-900/30 p-4 border border-red-500/30">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Password Updated!</h3>
              <p className="text-slate-400 text-sm">
                Your password has been changed successfully. Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdate}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-300">
                  New Password
                </label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-slate-950/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-slate-300">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-slate-950/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="group relative flex w-full justify-center items-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Update Password
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
