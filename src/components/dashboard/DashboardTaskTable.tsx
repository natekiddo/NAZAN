'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Project, Task } from '@/types';
import { formatDate } from '@/lib/utils';

type WorkFilter = 'All work' | 'In Progress' | 'Blocked' | 'Completed';

const filters: WorkFilter[] = ['All work', 'In Progress', 'Blocked', 'Completed'];

const statusStyles: Record<Task['status'], string> = {
  Backlog: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  'To Do': 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  'In Progress': 'bg-[var(--primary-soft)] text-[var(--foreground)]',
  Blocked: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
  Cancelled: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
};

const priorityStyles: Record<Task['priority'], string> = {
  Urgent: 'text-rose-700 dark:text-rose-200',
  High: 'text-amber-700 dark:text-amber-200',
  Medium: 'text-[var(--foreground)]',
  Low: 'text-[var(--muted-foreground)]',
};

export default function DashboardTaskTable({
  tasks,
  projects,
}: {
  tasks: Task[];
  projects: Project[];
}) {
  const [activeFilter, setActiveFilter] = useState<WorkFilter>('All work');
  const [query, setQuery] = useState('');
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );

  const visibleTasks = tasks.filter((task) => {
    const matchesStatus = activeFilter === 'All work' || task.status === activeFilter;
    const projectName = projectNames.get(task.project_id || '') || '';
    const matchesQuery = `${task.title} ${projectName}`.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  }).slice(0, 8);

  return (
    <section className="workspace-panel !p-0">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker mb-1">Work overview</p>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Tasks across your projects</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A live snapshot of your latest work items.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter work by status">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search tasks and projects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks and projects"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--input)] py-2 pl-9 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
        </label>
        <Link href="/tasks" className="workspace-text-link self-start sm:self-auto">
          Open task board <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-[.12em] text-[var(--muted-foreground)]">
              <th scope="col" className="px-5 py-3 font-medium sm:px-6">Work item</th>
              <th scope="col" className="px-4 py-3 font-medium">Project</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Priority</th>
              <th scope="col" className="px-4 py-3 font-medium">Due date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visibleTasks.map((task) => (
              <tr key={task.id} className="group transition-colors hover:bg-[var(--muted)]/60">
                <td className="max-w-[300px] px-5 py-3.5 sm:px-6">
                  <Link href="/tasks" className="block truncate text-xs font-semibold text-[var(--foreground)] group-hover:underline group-hover:underline-offset-4">
                    {task.title}
                  </Link>
                  <span className="mt-1 block truncate text-[9px] text-[var(--muted-foreground)]">{task.id.slice(0, 8).toUpperCase()}</span>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3.5 text-xs text-[var(--muted-foreground)]">
                  {projectNames.get(task.project_id || '') || 'Personal work'}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-medium ${statusStyles[task.status]}`}>
                    {task.status}
                  </span>
                </td>
                <td className={`px-4 py-3.5 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>
                  {task.priority}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[10px] tabular-nums text-[var(--muted-foreground)]">
                  {task.due_date ? formatDate(task.due_date) : '—'}
                </td>
              </tr>
            ))}
            {visibleTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-xs text-[var(--muted-foreground)]">
                  {tasks.length ? 'No work items match this filter.' : 'Tasks you create will appear here.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-[10px] text-[var(--muted-foreground)] sm:px-6">
        <span>Showing {visibleTasks.length} of {tasks.filter((task) => activeFilter === 'All work' || task.status === activeFilter).length} matching items</span>
        <Link href="/tasks" className="font-medium text-[var(--foreground)] hover:underline">View all tasks</Link>
      </div>
    </section>
  );
}
