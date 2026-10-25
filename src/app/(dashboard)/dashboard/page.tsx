import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  Layers3,
  Plus,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDuration } from '@/lib/utils';
import { Project, Task, WorkSession } from '@/types';
import AISummaryButton from '@/components/dashboard/AISummaryButton';
import StartSessionBannerButton from '@/components/dashboard/StartSessionBannerButton';
import DashboardTaskTable from '@/components/dashboard/DashboardTaskTable';
import ResumeWorkButton from '@/components/dashboard/ResumeWorkButton';

const workflowStatuses = ['Backlog', 'To Do', 'In Progress', 'Blocked'] as const;

const priorityStyles: Record<Task['priority'], string> = {
  Urgent: 'bg-rose-500',
  High: 'bg-amber-500',
  Medium: 'bg-sky-500',
  Low: 'bg-slate-400',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayKey = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const [
    { data: projectData },
    { data: taskData },
    { data: sessionData },
    { data: weeklySessionData },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'Archived')
      .order('updated_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('work_sessions')
      .select('*, project:projects(name)')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(5),
    supabase
      .from('work_sessions')
      .select('start_time, duration_mins')
      .eq('user_id', user.id)
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', new Date(today.getTime() + 86_400_000).toISOString()),
  ]);

  const projects = (projectData as unknown as Project[]) || [];
  const tasks = (taskData as unknown as Task[]) || [];
  const recentSessions =
    (sessionData as unknown as (WorkSession & {
      project?: { name: string } | null;
    })[]) || [];
  const weeklySessions = weeklySessionData || [];

  const activeProjects = projects.filter(
    (project) => project.status !== 'Completed'
  );
  const openTasks = tasks.filter(
    (task) => task.status !== 'Completed' && task.status !== 'Cancelled'
  );
  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length;
  const dueToday = openTasks.filter((task) => task.due_date === todayKey).length;
  const overdueTasks = openTasks.filter(
    (task) => task.due_date && task.due_date < todayKey
  );
  const blockedTasks = openTasks.filter(
    (task) => task.status === 'Blocked'
  ).length;

  const priorityRank: Record<Task['priority'], number> = {
    Urgent: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  const priorityQueue = [...openTasks]
    .filter((task) => task.due_date)
    .sort((a, b) => {
      const dueDateOrder = (a.due_date || '').localeCompare(b.due_date || '');
      return dueDateOrder || priorityRank[a.priority] - priorityRank[b.priority];
    })
    .slice(0, 5);

  const focusByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setUTCDate(day.getUTCDate() + index);
    const dateKey = day.toISOString().slice(0, 10);
    const minutes = weeklySessions.reduce((total, session) => {
      return session.start_time.slice(0, 10) === dateKey
        ? total + (session.duration_mins || 0)
        : total;
    }, 0);

    return {
      dateKey,
      label: day.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      minutes,
      isToday: dateKey === todayKey,
    };
  });
  const weeklyFocusMinutes = focusByDay.reduce(
    (total, day) => total + day.minutes,
    0
  );
  const maxDailyFocus = Math.max(...focusByDay.map((day) => day.minutes), 60);
  const focusChartPoints = focusByDay.map((day, index) => ({
    ...day,
    x: 18 + index * 110.7,
    y: 136 - (day.minutes / maxDailyFocus) * 94,
  }));
  const focusLinePath = focusChartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const focusAreaPath = `${focusLinePath} L ${focusChartPoints[focusChartPoints.length - 1].x} 150 L ${focusChartPoints[0].x} 150 Z`;

  const firstName =
    user.user_metadata?.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split('@')[0] ||
    'there';

  const nextTask = priorityQueue[0] || openTasks[0] || null;
  const nextTaskProject = nextTask
    ? projects.find((project) => project.id === nextTask.project_id)
    : null;
  const resumeSession = recentSessions.find((session) => session.next_action?.trim()) || null;
  const resumeProject = resumeSession
    ? projects.find((project) => project.id === resumeSession.project_id) || null
    : null;
  const savedNextProject = projects.find((project) => project.next_action?.trim()) || null;
  const resumeAction =
    resumeSession?.next_action?.trim() || savedNextProject?.next_action?.trim() || null;
  const focusProject = resumeSession ? resumeProject : savedNextProject || nextTaskProject;
  const greeting = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';
  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="dashboard-view mx-auto max-w-[1440px] space-y-7 pb-10">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-eyebrow"><span /> PROJECTHUB / DAILY BRIEF</p>
          <h1>Good {greeting},<br /><em>{firstName}.</em></h1>
          <p className="dashboard-hero-sub">Your work, progress, and next move in one clear view.</p>
          <div className="dashboard-hero-actions">
            <AISummaryButton />
            <StartSessionBannerButton />
          </div>
        </div>
        <aside className="dashboard-focus-card">
          <div className="dashboard-focus-top"><span>{resumeAction ? "PICK UP WHERE YOU LEFT OFF" : "NEXT STEP"}</span><span>{todayLabel}</span></div>
          <div className="dashboard-focus-mark" aria-hidden="true"><ArrowUpRight className="h-20 w-20" /></div>
          <div className="dashboard-focus-content">
            <p>{focusProject?.name || (nextTask ? 'Workspace task' : 'READY WHEN YOU ARE')}</p>
            <h2>{resumeAction || nextTask?.title || 'Choose your first next step.'}</h2>
            <span>{resumeSession ? `Last work session · ${formatDate(resumeSession.end_time || resumeSession.start_time)}` : resumeAction ? 'Saved project next step' : nextTask ? `${nextTask.priority} priority${nextTask.due_date ? ` · Due ${formatDate(nextTask.due_date)}` : ''}` : 'Create a task to start moving work forward.'}</span>
          </div>
          {focusProject ? (
            <ResumeWorkButton
              projectId={focusProject.id}
              projectName={focusProject.name}
              label="Resume project"
              className="dashboard-focus-link dashboard-resume-button"
            />
          ) : (
            <Link href={nextTask ? '/tasks' : '/projects'} className="dashboard-focus-link">
              {nextTask ? 'Open task queue' : 'Explore projects'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </aside>
      </section>

      {overdueTasks.length > 0 && (
        <Link
          href="/tasks"
          className="group flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-900 transition-colors hover:border-rose-300 dark:border-rose-400/20 dark:bg-rose-400/[0.08] dark:text-rose-100 dark:hover:border-rose-400/40"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {overdueTasks.length} overdue{' '}
                {overdueTasks.length === 1 ? 'task needs' : 'tasks need'} your
                attention
              </span>
              <span className="mt-0.5 block truncate text-xs text-rose-700/80 dark:text-rose-200/70">
                Review your queue and get the next milestone back on track.
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <section
        aria-label="Workspace metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Active projects"
          value={activeProjects.length}
          detail={`${projects.length} total in your workspace`}
          icon={<FolderKanban className="h-4 w-4" />}
          accent="blue"
        />
        <MetricCard
          label="Open work"
          value={openTasks.length}
          detail={`${blockedTasks} blocked · ${overdueTasks.length} overdue`}
          icon={<Layers3 className="h-4 w-4" />}
          accent="violet"
        />
        <MetricCard
          label="Due today"
          value={dueToday}
          detail={dueToday ? 'Keep today’s commitments moving' : 'Nothing due today'}
          icon={<CalendarDays className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Completed"
          value={completedTasks}
          detail="Tasks finished across your workspace"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="green"
        />
      </section>

      <DashboardTaskTable tasks={tasks} projects={projects} />

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="workspace-panel !p-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Focus activity
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Logged work sessions over the last 7 days
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-right">
              <p className="text-lg font-semibold leading-none text-slate-950 dark:text-white">
                {formatDuration(weeklyFocusMinutes)}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                This week
              </p>
            </div>
          </div>

          <div className="px-5 pb-5 pt-6 sm:px-6">
            <div className="h-40 w-full" role="img" aria-label="Logged focus minutes across the last seven days">
              <svg className="h-[calc(100%_-_24px)] w-full overflow-visible" viewBox="0 0 700 165" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="focusArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity=".16" />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[32, 70, 108, 146].map((y) => <line key={y} x1="12" y1={y} x2="688" y2={y} stroke="var(--border)" strokeDasharray="3 5" />)}
                <path d={focusAreaPath} fill="url(#focusArea)" />
                <path d={focusLinePath} fill="none" stroke="var(--foreground)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                {focusChartPoints.map((point) => <circle key={point.dateKey} cx={point.x} cy={point.y} r={point.isToday ? 4.5 : 3.5} fill="var(--background)" stroke="var(--foreground)" strokeWidth="2"><title>{`${point.label}: ${formatDuration(point.minutes)}`}</title></circle>)}
              </svg>
              <div className="flex justify-between px-1 pt-1 text-[9px] font-medium text-slate-500">
                {focusChartPoints.map((point) => <span key={point.dateKey} className={point.isToday ? 'font-semibold text-slate-900 dark:text-white' : ''}>{point.label}</span>)}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {weeklySessions.length
                  ? `${weeklySessions.length} sessions logged`
                  : 'Your first session will appear here'}
              </p>
              <Link
                href="/sessions"
                className="workspace-text-link"
              >
                View sessions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="workspace-panel !p-0">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Workflow health
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Work items by current status
              </p>
            </div>
            <Link
              href="/tasks"
              aria-label="Open task board"
              className="workspace-icon-link"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            {workflowStatuses.map((status) => {
              const count = openTasks.filter(
                (task) => task.status === status
              ).length;
              const percentage = openTasks.length
                ? (count / openTasks.length) * 100
                : 0;

              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Circle
                        className={`h-2.5 w-2.5 ${
                          status === 'Blocked'
                            ? 'fill-rose-500 text-rose-500'
                            : status === 'In Progress'
                              ? 'fill-indigo-500 text-indigo-500'
                              : status === 'To Do'
                                ? 'fill-sky-500 text-sky-500'
                                : 'text-slate-400'
                        }`}
                      />
                      {status}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        status === 'Blocked'
                          ? 'bg-rose-500'
                          : status === 'In Progress'
                            ? 'bg-indigo-500'
                            : status === 'To Do'
                              ? 'bg-sky-500'
                              : 'bg-slate-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {openTasks.length} active work items
              </span>
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                {completedTasks} completed
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="workspace-panel !p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div>
              <p className="section-kicker mb-1">Keep momentum</p>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Your projects
              </h2>
            </div>
            <Link href="/projects" className="workspace-text-link">
              All projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-8 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
                <FolderKanban className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Your next big thing starts here
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Create a project to bring its tasks, progress, and milestones
                into one clear view.
              </p>
              <Link href="/projects" className="workspace-primary-button mt-4">
                <Plus className="h-3.5 w-3.5" /> Create a project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activeProjects.slice(0, 4).map((project) => {
                const projectTasks = tasks.filter(
                  (task) =>
                    task.project_id === project.id &&
                    task.status !== 'Cancelled'
                );
                const projectDone = projectTasks.filter(
                  (task) => task.status === 'Completed'
                ).length;
                const progress = projectTasks.length
                  ? Math.round((projectDone / projectTasks.length) * 100)
                  : Math.min(100, Math.max(0, project.progress || 0));

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-indigo-700 dark:text-indigo-200">
                        <FolderKanban className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-200">
                          {project.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {project.category || 'Project'} · {project.status}
                          {project.deadline
                            ? ` · Due ${formatDate(project.deadline)}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-12 sm:w-40 sm:shrink-0 sm:pl-0">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                        {progress}%
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="workspace-panel !p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div>
              <p className="section-kicker mb-1">Stay ahead</p>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Priority queue
              </h2>
            </div>
            <Link href="/tasks" className="workspace-text-link">
              Task board <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {priorityQueue.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-8 text-center">
              <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                No deadlines in your queue
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add due dates to tasks to keep important work visible.
              </p>
              <Link href="/tasks" className="workspace-secondary-button mt-4">
                Open task board
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {priorityQueue.map((task) => {
                const isOverdue = Boolean(
                  task.due_date && task.due_date < todayKey
                );
                return (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025] sm:px-6"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${priorityStyles[task.priority]}`}
                        aria-label={`${task.priority} priority`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-200">
                          {task.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                          {task.priority} priority · {task.status}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-medium ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : formatDate(task.due_date)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="workspace-panel !p-0">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div>
            <p className="section-kicker mb-1">Recently focused</p>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Recent work sessions
            </h2>
          </div>
          <Link href="/sessions" className="workspace-text-link">
            Session history <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center px-6 py-8 text-center">
            <Clock3 className="mb-2 h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Your focus log starts here
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start a work session to keep a record of your progress.
            </p>
          </div>
        ) : (
          <div className="grid divide-y divide-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
            {recentSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="flex min-w-0 gap-3 px-5 py-4 sm:px-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {session.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {session.project?.name || session.work_completed || 'Work session'}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{formatDate(session.start_time)}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {formatDuration(session.duration_mins)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  accent: 'blue' | 'violet' | 'amber' | 'green';
}) {
  const accentStyles = {
    blue: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    violet: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    amber: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    green: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  };

  return (
    <div className="workspace-stat !p-4 sm:!p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentStyles[accent]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
}
