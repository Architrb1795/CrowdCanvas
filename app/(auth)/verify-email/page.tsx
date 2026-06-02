'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Verify Email</h2>
            <p className="text-sm text-slate-400">
              Didn&apos;t receive your verification email? Enter your address to resend it.
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

          {success && (
            <div className="mb-6 rounded-xl bg-emerald-900/30 p-4 border border-emerald-500/30">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-emerald-300">Verification email sent! Please check your inbox.</h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleResend}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-300">
                Email address
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 bg-slate-950/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email}
                className="group relative flex w-full justify-center items-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Resend Verification Email
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
