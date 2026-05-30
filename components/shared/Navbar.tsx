'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, Bell, Sparkles, Image as ImageIcon, Calendar, UploadCloud, Info, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const navLinks = [
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Gallery', href: '/media', icon: ImageIcon },
    { name: 'AI Search', href: '/search', icon: Sparkles },
    { name: 'Upload', href: '/upload', icon: UploadCloud },
    { name: 'About', href: '/', icon: Info },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                CrowdCanvas
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
              >
                <link.icon className="w-4 h-4 text-slate-400" />
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Action */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-950"></span>
                </button>
                <div className="h-6 w-px bg-slate-800 mx-1"></div>
                
                {/* Custom User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 pl-2 pr-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-full transition-colors focus:outline-none">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden border border-indigo-500/30">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl shadow-xl shadow-black/50 flex flex-col gap-1">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <div className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || 'User'}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                      
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <User className="w-4 h-4 text-indigo-400" /> Profile Dashboard
                      </Link>
                      
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <ImageIcon className="w-4 h-4 text-emerald-400" /> My Uploads
                      </Link>

                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" /> Account Settings
                      </Link>
                      
                      <div className="h-px bg-white/5 my-1"></div>
                      
                      <button 
                        onClick={() => supabase.auth.signOut()} 
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left w-full"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button className="p-2 text-slate-400">
                <Bell className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-slate-900 border-b border-white/10"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <link.icon className="w-5 h-5 text-indigo-400" />
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href="/profile" className="w-full">
                      <Button variant="secondary" className="w-full justify-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full justify-center text-red-400 border-red-500/20">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                      <Button variant="secondary" className="w-full justify-center">Sign In</Button>
                    </Link>
                    <Link href="/login" className="w-full">
                      <Button variant="gradient" className="w-full justify-center">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
