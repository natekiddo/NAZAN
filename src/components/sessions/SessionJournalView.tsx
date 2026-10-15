'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Play,
  Plus,
  Search,
  Filter,
  FolderGit2,
  Calendar,
  Sparkles,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { WorkSession, Project } from '@/types';
import SessionCard from './SessionCard';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { useRouter } from 'next/navigation';

interface SessionJournalViewProps {
  initialSessions: (WorkSession & {
    project?: { name: string } | null;
    task?: { title: string } | null;
  })[];
  projects: Project[];
}

export default function SessionJournalView({
  initialSessions,
  projects,
}: SessionJournalViewProps) {
  const router = useRouter();
  const { openStartDialog, openLogModal } = useSessionTimer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // KPI Calculations
  const totalMinutes = useMemo(
    () => initialSessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0),
    [initialSessions]
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  const thisWeekMinutes = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return initialSessions
      .filter((s) => new Date(s.start_time) >= oneWeekAgo)
      .reduce((acc, s) => acc + (s.duration_mins || 0), 0);
  }, [initialSessions]);
  const thisWeekHours = (thisWeekMinutes / 60).toFixed(1);

  const distinctProjectsCount = useMemo(() => {
    const set = new Set(initialSessions.map((s) => s.project_id));
    return set.size;
  }, [initialSessions]);

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    return initialSessions
      .filter((s) => {
        if (selectedProjectId !== 'all' && s.project_id !== selectedProjectId) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchWork = s.work_completed?.toLowerCase().includes(q) || false;
          const matchNext = s.next_action?.toLowerCase().includes(q) || false;
          const matchProj = s.project?.name.toLowerCase().includes(q) || false;
          const matchBlockers = s.problems_encountered?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchWork && !matchNext && !matchProj && !matchBlockers) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.start_time).getTime();
        const timeB = new Date(b.start_time).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [initialSessions, selectedProjectId, searchQuery, sortOrder]);

  return (
    <div className="workspace-page space-y-7 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">A record of focused work</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white flex items-center gap-2.5">
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"><Clock className="w-5 h-5" /></span>
            Work sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            See where your time goes and pick up right where you left off.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openStartDialog()}
            className="workspace-primary-button"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Start timer
          </button>
          <button
            onClick={() => openLogModal()}
            className="workspace-secondary-button"
          >
            <Plus className="w-3.5 h-3.5" />
            Log a session
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="workspace-stat space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Hours Logged
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {totalHours}
            </span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
        </div>

        <div className="workspace-stat space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Sessions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {initialSessions.length}
            </span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
        </div>

        <div className="workspace-stat space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Past 7 Days
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {thisWeekHours}
            </span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
        </div>

        <div className="workspace-stat space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Projects Worked
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {distinctProjectsCount}
            </span>
            <span className="text-xs text-slate-500">projects</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="workspace-panel flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 !p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries, accomplishments, stopping points..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-transparent focus:border-[#91b76a] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-[#91b76a] focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            title="Toggle chronological order"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Session Journal List */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
              {initialSessions.length === 0
                ? 'No work sessions recorded yet'
                : 'No sessions match your filter criteria'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {initialSessions.length === 0
                ? 'Start a live timer or log your past sessions to keep track of your focus time and resume work smoothly.'
                : 'Try adjusting your search terms or selecting a different project filter.'}
            </p>
          </div>
          {initialSessions.length === 0 && (
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => openStartDialog()}
                className="workspace-primary-button"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Start a session
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDeleted={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
