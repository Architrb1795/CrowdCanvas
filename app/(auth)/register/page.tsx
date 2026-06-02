'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, AlertCircle, ChevronRight, Camera, Sparkles, Search, Users, Activity, User, AtSign } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Basic password strength validation
  const isPasswordStrong = (pass: string) => pass.length >= 8;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!isPasswordStrong(password)) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    // In a real production app, we would query the database here to ensure the username isn't taken.
    // For now, we will pass it in the user metadata and handle conflicts via DB constraints later if needed.

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.toLowerCase().replace(/\s+/g, ''),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('Account created successfully! Check your email to verify your account before logging in.');
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-950 flex-col justify-between p-12">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600 blur-[120px] mix-blend-screen animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600 blur-[120px] mix-blend-screen" style={{ animationDelay: '2s' }} />
           <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px] mix-blend-screen" style={{ animationDelay: '4s' }} />
        </div>

        {/* Branding */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CrowdCanvas</span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg mt-20">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Experience</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed">
            Create an account to start organizing, finding, and sharing your most cherished event memories with friends.
          </p>

          <div className="space-y-6">
            {[
              { icon: Sparkles, text: 'Instantly find photos of yourself' },
              { icon: Search, text: 'Search by vibe, color, or objects' },
              { icon: Users, text: 'Connect with event attendees' },
              { icon: Activity, text: 'Build personal memory collections' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center text-indigo-50 group">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-4 group-hover:bg-indigo-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-indigo-300" />
                </div>
                <span className="font-medium text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-sm">© {new Date().getFullYear()} CrowdCanvas Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-slate-950 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          <div className="text-center lg:text-left mb-8 mt-10 lg:mt-0">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create an account</h2>
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="space-y-4">
              <button
                onClick={() => handleOAuth('google')}
                className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-700/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
              
              <button
                 onClick={() => handleOAuth('github')}
                 className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-700/50 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md"
              >
                 <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                 </svg>
                 Sign up with GitHub
              </button>
            </div>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-slate-950 px-6 text-slate-500">or sign up with email</span>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-900/30 p-4 border border-red-500/30 backdrop-blur-sm">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mt-6 rounded-xl bg-emerald-900/30 p-4 border border-emerald-500/30 backdrop-blur-sm">
                <div className="flex">
                  <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-emerald-300">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleRegister}>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="fullName" className="block text-sm font-medium leading-6 text-slate-300">
                    Full Name
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-slate-900/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div className="w-1/2">
                  <label htmlFor="username" className="block text-sm font-medium leading-6 text-slate-300">
                    Username
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <AtSign className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-slate-900/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                      placeholder="janedoe"
                    />
                  </div>
                </div>
              </div>

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
                    className="block w-full rounded-xl border-0 bg-slate-900/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-300">
                  Password
                </label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-slate-900/50 py-3 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 relative flex w-full justify-center items-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
