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
  BriefcaseBusiness,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandMark from '@/components/brand/BrandMark';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'blue' | 'purple' | 'emerald' | 'amber';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderGit2 },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Tools',
    items: [
      { name: 'Work sessions', href: '/sessions', icon: Clock },
      { name: 'Google Drive', href: '/drive', icon: HardDrive, badge: 'Drive', badgeColor: 'emerald' },
      { name: 'Files', href: '/files', icon: FileText },
      { name: 'AI assistant', href: '/ai-assistant', icon: Bot, badge: 'AI', badgeColor: 'purple' },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleButton = (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="sidebar-toggle cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </button>
  );

  return (
    <aside
      className={cn(
        'dashboard-sidebar sticky top-0 z-30 flex h-screen select-none flex-col self-start border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-slate-600 transition-all duration-300 dark:text-slate-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex min-h-16 items-center gap-1 p-3',
          collapsed ? 'justify-center px-0' : 'justify-between'
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'group flex items-center gap-3 overflow-hidden',
            !collapsed && 'flex-1 rounded-xl border border-slate-200 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5'
          )}
        >
          <BrandMark size={36} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />

          {!collapsed && (
            <div className="sidebar-expanded-content flex flex-col">
              <span className="font-display whitespace-nowrap text-[17px] font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">
                ProjectHub
              </span>
              <span className="-mt-0.5 text-[11px] font-medium text-slate-500">
                Personal workspace
              </span>
            </div>
          )}
        </Link>

        {!collapsed && toggleButton}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1 border-slate-200 first:border-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-5 dark:border-white/10">
            {!collapsed && (
              <h5 className="sidebar-section-heading mb-2 px-3 text-[13px] font-medium text-slate-900 dark:text-slate-100">
                {section.title}
              </h5>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.name}
                    className={cn(
                      'sidebar-link-item group relative flex items-center gap-3 rounded-xl border py-2.5 text-[14px] font-medium transition-colors',
                      collapsed ? 'justify-center px-0' : 'px-3',
                      isActive
                        ? 'border-slate-200 bg-white text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/10 dark:text-white'
                        : 'border-transparent text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
                    )}
                  >

                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                      )}
                    />

                    {!collapsed && (
                      <span className="sidebar-expanded-content flex-1 truncate">{item.name}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'sidebar-expanded-content mono-label rounded-md border px-1.5 py-0.5 text-[9px] font-medium',
                          item.badgeColor === 'emerald'
                            ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                            : 'border-slate-200 text-slate-500 dark:border-white/15 dark:text-slate-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Workspace status */}
      <div className="sidebar-footer space-y-3 border-t border-slate-200 p-3.5 text-xs dark:border-white/10">
        {collapsed && <div className="flex justify-center">{toggleButton}</div>}

        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-slate-900 dark:text-slate-100">Made for focus</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">Your work, in one place</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" title="Online" />
          </div>
        )}
      </div>
    </aside>
  );
}
