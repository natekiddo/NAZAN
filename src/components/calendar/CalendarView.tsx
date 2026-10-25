'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckSquare,
  FolderGit2,
  Flag,
  Bell,
  Filter,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Project, Task, Milestone, Reminder } from '@/types';
import ReminderModal from './ReminderModal';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'task' | 'project' | 'milestone' | 'reminder';
  priority?: string;
  status?: string;
  project_name?: string;
  project_id?: string;
}

interface CalendarViewProps {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  reminders: Reminder[];
}

export default function CalendarView({
  projects,
  tasks,
  milestones,
  reminders,
}: CalendarViewProps) {
  const router = useRouter();

  // Navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'task' | 'project' | 'milestone' | 'reminder'>('all');

  // Selected date modal / creation
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderModalDefaultDate, setReminderModalDefaultDate] = useState<string | undefined>(undefined);

  // Normalize all items into CalendarEvents
  const allEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Tasks
    tasks.forEach((t) => {
      if (t.due_date) {
        const proj = projects.find((p) => p.id === t.project_id);
        list.push({
          id: `task_${t.id}`,
          title: t.title,
          date: t.due_date,
          type: 'task',
          priority: t.priority,
          status: t.status,
          project_name: proj?.name,
          project_id: t.project_id || undefined,
        });
      }
    });

    // 2. Projects
    projects.forEach((p) => {
      if (p.deadline) {
        list.push({
          id: `proj_${p.id}`,
          title: `Project Deadline: ${p.name}`,
          date: p.deadline.split('T')[0],
          type: 'project',
          status: p.status,
          project_name: p.name,
          project_id: p.id,
        });
      }
    });

    // 3. Milestones
    milestones.forEach((m) => {
      if (m.due_date) {
        const proj = projects.find((p) => p.id === m.project_id);
        list.push({
          id: `mile_${m.id}`,
          title: `Milestone: ${m.title}`,
          date: m.due_date.split('T')[0],
          type: 'milestone',
          status: m.completed ? 'Completed' : 'Pending',
          project_name: proj?.name,
          project_id: m.project_id,
        });
      }
    });

    // 4. Reminders
    reminders.forEach((r) => {
      list.push({
        id: `rem_${r.id}`,
        title: r.title,
        date: r.scheduled_for.split('T')[0],
        type: 'reminder',
        status: r.status,
      });
    });

    return list;
  }, [projects, tasks, milestones, reminders]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (selectedProjectId !== 'all' && ev.project_id !== selectedProjectId) {
        return false;
      }
      if (selectedTypeFilter !== 'all' && ev.type !== selectedTypeFilter) {
        return false;
      }
      return true;
    });
  }, [allEvents, selectedProjectId, selectedTypeFilter]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Calendar Grid Cells (including leading blanks)
  const calendarDays = useMemo(() => {
    const days: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dayNumber: d,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dayNumber: i,
        dateStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  const getEventBadgeClass = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'task':
        return 'bg-brand-50 dark:bg-slate-800 text-brand-500 dark:text-saffron-400 border-brand-100 dark:border-brand-700';
      case 'project':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'milestone':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'reminder':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="workspace-page space-y-7 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">Make room for what matters</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white flex items-center gap-2.5">
            <span className="rounded-xl bg-brand-50 p-2 text-brand-500 dark:bg-slate-800 dark:text-saffron-400"><CalendarIcon className="w-5 h-5" /></span>
            Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Deadlines, milestones, and reminders in one thoughtful view.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setReminderModalDefaultDate(undefined);
              setIsReminderModalOpen(true);
            }}
            className="workspace-primary-button"
          >
            <Plus className="w-3.5 h-3.5" />
            New reminder
          </button>
        </div>
      </div>

      {/* Calendar Controls & Navigation Bar */}
      <div className="workspace-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 !p-4">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Project dropdown */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Type dropdown */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="task">Tasks</option>
            <option value="project">Project Deadlines</option>
            <option value="milestone">Milestones</option>
            <option value="reminder">Reminders</option>
          </select>

          {/* View toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-brand-500 dark:text-saffron-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-brand-500 dark:text-saffron-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        /* Month Grid */
        <div className="workspace-panel !p-0 overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr);

              return (
                <div
                  key={`${cell.dateStr}_${idx}`}
                  onClick={() => {
                    setSelectedDayEvents({ date: cell.dateStr, events: dayEvents });
                  }}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      : 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                        isToday
                          ? 'bg-brand-500 text-white font-bold shadow-xs dark:bg-saffron-400 dark:text-slate-900'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReminderModalDefaultDate(cell.dateStr);
                        setIsReminderModalOpen(true);
                      }}
                      title="Add reminder for this day"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-brand-500 dark:hover:text-saffron-400 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 my-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        title={`${ev.title} (${ev.type})`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${getEventBadgeClass(
                          ev.type
                        )}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium pl-1 block">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                No scheduled events
              </h3>
              <p className="text-xs text-slate-500">
                No task deadlines, project targets, or reminders match your filters.
              </p>
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${getEventBadgeClass(
                        ev.type
                      )}`}
                    >
                      {ev.type}
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        {ev.title}
                      </h4>
                      {ev.project_name && (
                        <span className="text-slate-400 text-[11px]">
                          Project: {ev.project_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {formatDate(ev.date)}
                    </span>
                    {ev.project_id && (
                      <Link
                        href={`/projects/${ev.project_id}`}
                        className="p-1 text-slate-400 hover:text-brand-500 dark:hover:text-saffron-400 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Selected Day Agenda Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Schedule for {formatDate(selectedDayEvents.date)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayEvents.events.length} event(s) scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto space-y-2.5 text-xs">
              {selectedDayEvents.events.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No events scheduled for this date.</p>
              ) : (
                selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase mb-1 border ${getEventBadgeClass(
                          ev.type
                        )}`}
                      >
                        {ev.type}
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">{ev.title}</h4>
                      {ev.project_name && (
                        <p className="text-[11px] text-slate-400">Project: {ev.project_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950">
              <button
                onClick={() => {
                  setReminderModalDefaultDate(selectedDayEvents.date);
                  setSelectedDayEvents(null);
                  setIsReminderModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-brand-500 dark:text-saffron-400 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add reminder for this day
              </button>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        defaultDate={reminderModalDefaultDate}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
