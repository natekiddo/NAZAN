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
  Flame,
  ShieldCheck,
  Zap,
  Activity,
  HardDrive,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { useTheme } from '@/context/ThemeContext';
import WorkspaceSwitcher from '@/components/workspaces/WorkspaceSwitcher';
import { Workspace } from '@/types';

interface TopNavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
  unreadCount?: number;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onOpenSearch?: () => void;
  onOpenQuickCreate?: () => void;
}

export default function TopNavbar({
  userEmail,
  userName,
  avatarUrl,
  unreadCount = 0,
  workspaces = [],
  activeWorkspaceId = '',
  onOpenSearch,
  onOpenQuickCreate,
}: TopNavbarProps) {
  const { activeSession, elapsedSeconds, stopAndRecord } = useSessionTimer();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#090D16]/80 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 transition-colors duration-200">
      {/* Search Input & Live Session Indicator */}
      <div className="flex items-center gap-3.5 flex-1 max-w-2xl">
        {workspaces && workspaces.length > 0 && (
          <div className="hidden sm:block">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
            />
          </div>
        )}

        <button
          onClick={onOpenSearch}
          aria-label="Search workspace and projects"
          className="group flex items-center gap-3 w-full max-w-md px-3.5 py-2 text-sm text-slate-400 bg-slate-900/80 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] max-md:w-10 max-md:justify-center max-md:px-0"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="flex-1 text-left text-xs font-medium text-slate-400 max-md:hidden">
            Search projects, tasks, files, members...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 border border-slate-700/80 rounded-md">
            Ctrl K
          </kbd>
        </button>

        {activeSession && (
          <div
            title="Active work session — click End Session to save"
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-medium shadow-xs animate-in fade-in"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span className="font-semibold text-[10px] uppercase tracking-wider text-indigo-400">
              Session:
            </span>
            <span className="font-mono font-bold text-white tracking-tight">{timerDisplay}</span>
            <span className="truncate max-w-[120px] text-slate-300">
              {activeSession.projectName}
            </span>
            <button
              onClick={stopAndRecord}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white ml-1 cursor-pointer transition-all"
            >
              End
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Google Drive Auto-Sync, Quick Action, Theme Toggle, Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Google Drive Status Pill */}
        <Link
          href="/drive"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-300 transition-colors"
          title="Google Drive Storage Active"
        >
          <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          <span>Drive: Connected</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </Link>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">New Project</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
          title="Toggle Light / Dark mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Notifications Icon with Pill Counter */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-2xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-slate-950 bg-emerald-400 rounded-full px-1 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar Card Dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center p-[2px] rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-xs"
            title="Account & Workspace Profile"
          >
            <div className="rounded-[14px] bg-[#090D16] p-[1.5px]">
              {avatarUrl ? (
                // eslint-disable-next-next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-xl object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-72 p-2 bg-[#0d1424] border border-slate-800 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="p-4 text-center rounded-2xl bg-slate-900/80 border border-slate-800 mb-2">
                <div className="inline-block p-[2px] rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-indigo-400 flex items-center justify-center text-lg font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{displayName}</h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{displayEmail}</p>

                <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Workspace Member • Pro</span>
                </div>
              </div>

              <div className="space-y-1 px-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SettingsIcon className="w-4 h-4 text-slate-400" />
                    <span>Workspace Settings</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Manage</span>
                </Link>

                <Link
                  href="/drive"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span>Google Drive Storage</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Auto-Sync</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
