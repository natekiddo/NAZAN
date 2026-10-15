'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  Clock,
  FileText,
  Bot,
  HardDrive,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  MessageSquare,
  Video,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'slate';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'WORKSPACE',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderGit2 },
      { name: 'Tasks & Boards', href: '/tasks', icon: CheckSquare },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'COLLABORATION & AI',
    items: [
      { name: 'Team Chat', href: '/chat', icon: MessageSquare, badge: 'Live', badgeColor: 'indigo' },
      { name: 'Voice & Video', href: '/calls', icon: Video },
      { name: 'Work Sessions', href: '/sessions', icon: Clock },
      { name: 'Google Drive', href: '/drive', icon: HardDrive, badge: 'Cloud', badgeColor: 'cyan' },
      { name: 'Project Files', href: '/files', icon: FileText },
      { name: 'Gemini AI Assistant', href: '/ai-assistant', icon: Bot, badge: '3.8 Flash', badgeColor: 'indigo' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Members & Roles', href: '/workspace/members', icon: Users },
      { name: 'Plans & Billing', href: '/pricing', icon: CreditCard },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'dashboard-sidebar relative flex flex-col bg-[#090D16]/95 backdrop-blur-2xl text-slate-100 transition-all duration-300 z-30 min-h-screen border-r border-slate-800/80 select-none shadow-2xl',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <svg width="20" height="24" viewBox="0 0 22 26" aria-hidden="true">
              <path d="M2 0h18a2 2 0 0 1 2 2v24l-11-7L0 26V2a2 2 0 0 1 2-2z" fill="#F5A623" />
            </svg>
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap font-display">
                ProjectHub
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider -mt-0.5 uppercase">
                AI Platform OS
              </span>
            </div>
          )}
        </Link>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h5 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {section.title}
              </h5>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                      isActive
                        ? 'bg-white/5 text-white border-l-2 border-[#F5A623] font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                        isActive ? 'text-[#F5A623]' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                          item.badgeColor === 'indigo' &&
                            'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
                          item.badgeColor === 'cyan' &&
                            'bg-sky-500/20 text-sky-300 border border-sky-500/30',
                          item.badgeColor === 'emerald' &&
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                          item.badgeColor === 'amber' &&
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                          item.badgeColor === 'slate' &&
                            'bg-slate-800 text-slate-400 border border-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-slate-800">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Workspace Plan Footer Widget */}
      <div className="p-3 border-t border-slate-800/80 text-xs">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Workspace Plan
              </span>
              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                Free
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Active Members</span>
              <span className="font-semibold text-slate-300">1 / 2 Free</span>
            </div>
            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '50%' }} />
            </div>
            <Link
              href="/pricing"
              className="block text-center text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-0.5"
            >
              Upgrade for 3+ members &rarr;
            </Link>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm" title="Free Plan (1/2 members)" />
          </div>
        )}
      </div>
    </aside>
  );
}