'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  LogOut,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Sparkles,
  Cloud,
  BriefcaseBusiness,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { useTheme } from '@/context/ThemeContext';

interface TopNavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
  unreadCount?: number;
  onOpenSearch?: () => void;
  onOpenQuickCreate?: () => void;
}

export default function TopNavbar({
  userEmail,
  userName,
  avatarUrl,
  unreadCount = 0,
  onOpenSearch,
  onOpenQuickCreate,
}: TopNavbarProps) {
  const { activeSession, elapsedSeconds, stopAndRecord } = useSessionTimer();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const timerDisplay = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;
  const displayName = userName || userEmail?.split('@')[0] || 'Developer';
  const displayEmail = userEmail || 'developer@projecthub.dev';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-3 sm:px-5 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200">
      {/* Search and active session */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={onOpenSearch}
          aria-label="Search projects, tasks, and sessions"
          className="group flex items-center gap-3 w-full max-w-md px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-300 dark:hover:border-brand-400 transition-all cursor-pointer max-md:w-10 max-md:shrink-0 max-md:justify-center max-md:px-0"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-500 dark:group-hover:text-saffron-400 transition-colors" />
          <span className="flex-1 text-left text-xs font-medium text-slate-600 dark:text-slate-300 max-md:hidden">
            Search projects, tasks, sessions...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            Ctrl K
          </kbd>
        </button>

        {activeSession && (
          <div
            title="Active work session — end it to save your progress"
            className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-brand-700 text-brand-700 dark:text-saffron-400 text-xs font-medium animate-in fade-in"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-[10px] uppercase tracking-wider text-brand-500 dark:text-saffron-400">
              Session:
            </span>
            <span className="font-mono font-bold tracking-tight">{timerDisplay}</span>
            <span className="truncate max-w-[120px] font-semibold text-slate-900 dark:text-white">
              {activeSession.projectName}
            </span>
            <button
              onClick={stopAndRecord}
              className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all cursor-pointer ml-1"
            >
              End
            </button>
          </div>
        )}
      </div>

      {/* Workspace actions */}
      <div className="flex items-center gap-2.5">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-saffron-400" />
          <span>AI tools</span>
        </div>

        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-saffron-400 dark:hover:bg-saffron-400 text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create new</span>
        </button>

        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800/70 transition-all cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        <Link
          href="/notifications"
          className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800/70 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#d93025] rounded-full px-1 shadow-2xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center rounded-full ring-2 ring-transparent hover:ring-brand-300 transition duration-200 cursor-pointer"
            title="Your ProjectHub profile"
          >
            <div className="rounded-full bg-white dark:bg-slate-950 p-0.5">
              {avatarUrl ? (
                // eslint-disable-next-next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-saffron-400 dark:bg-saffron-400 dark:text-slate-900 font-semibold text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-72 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Account Identity Header */}
              <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 mb-2">
                <div className="inline-block rounded-full bg-slate-200 p-0.5 mb-2 dark:bg-slate-700">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-saffron-400 dark:bg-saffron-400 dark:text-slate-900 flex items-center justify-center text-lg font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">{displayEmail}</p>

                <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <BriefcaseBusiness className="w-3.5 h-3.5 text-brand-500 dark:text-saffron-400" />
                  <span>ProjectHub workspace</span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-1 px-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>Workspace Settings</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Manage</span>
                </Link>

                <Link
                  href="/drive"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-slate-500" />
                    <span>Google Drive Integration</span>
                  </div>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#d93025] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#d93025]" />
                  <span>Sign out of all sessions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
