import React from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Play,
  CheckCircle2,
  Plus,
  Activity,
  Layers,
  HardDrive,
  TrendingUp,
  Zap,
  Bot,
  Compass,
  ChevronRight,
  ShieldCheck,
  Flame,
  MessageSquare,
  Video,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDuration } from '@/lib/utils';
import { Project, Task, WorkSession } from '@/types';
import StartSessionBannerButton from '@/components/dashboard/StartSessionBannerButton';
import AISummaryButton from '@/components/dashboard/AISummaryButton';
import CrmVelocityChart from '@/components/dashboard/CrmVelocityChart';
import { getDriveIntegrationStatus } from '@/lib/actions/drive';
import { getProjects } from '@/lib/actions/projects';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  let activeProjects: Project[] = [];
  let totalTasksCount = 0;
  let completedTasksCount = 0;
  let todayTasksCount = 0;
  let overdueTasksCount = 0;
  let recentSessions: (WorkSession & { project?: { name: string } | null })[] = [];
  let upcomingTasks: Task[] = [];
  let driveConnected = false;

  if (userId) {
    // 1. Projects
    const projectsRes = await getProjects();
    activeProjects = (projectsRes.projects || []).filter((p) => p.status !== 'Archived');

    // 2. Tasks
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    const allTasks = (taskData as unknown as Task[]) || [];

    if (allTasks.length > 0) {
      totalTasksCount = allTasks.length;
      completedTasksCount = allTasks.filter((t) => t.status === 'Completed').length;
      const todayStr = new Date().toISOString().split('T')[0];

      todayTasksCount = allTasks.filter(
        (t) => t.due_date === todayStr && t.status !== 'Completed'
      ).length;

      overdueTasksCount = allTasks.filter(
        (t) => t.due_date && t.due_date < todayStr && t.status !== 'Completed'
      ).length;

      upcomingTasks = allTasks
        .filter((t) => t.due_date && t.status !== 'Completed')
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
        .slice(0, 5);
    }

    // 3. Work sessions
    const { data: sessData } = await supabase
      .from('work_sessions')
      .select('*, project:projects(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);
    recentSessions = (sessData as unknown as (WorkSession & { project?: { name: string } | null })[]) || [];

    // 4. Drive status
    try {
      const driveRes = await getDriveIntegrationStatus();
      driveConnected = driveRes.connected;
    } catch {}
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer';
  const totalSessionMinutes = recentSessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0);
  const totalLoggedHours = (totalSessionMinutes / 60).toFixed(1);
  const taskCompletionPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Determine time-of-day greeting
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // Ground-truth stopping point resume candidate
  const resumeProject = activeProjects.find((p) => p.next_action) || activeProjects[0] || null;
  const resumeSession = recentSessions.find((s) => s.work_completed || (resumeProject && s.project_id === resumeProject.id)) || recentSessions[0] || null;
  const stoppingPointNote = resumeSession?.work_completed || resumeProject?.next_action || 'Sprint pipeline initialized — ready for your next focused session.';

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100 pb-12">
      {/* =========================================================================
          1. HERO COMMANDER: GEMINI AI COPILOT & WORKSPACE TELEMETRY
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0d1428]/95 to-slate-950 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative z-10 space-y-6">
          {/* Top Pill & Live Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-indigo-500/30 text-xs font-semibold text-slate-200 shadow-sm shadow-indigo-950/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-bold">
                Gemini 3.8 Flash Neural Assistant
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Workspace OS</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/drive"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 hover:border-sky-500/40 text-[11px] font-medium text-slate-300 transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>Drive: {driveConnected ? 'Connected' : 'Ready'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${driveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 text-[11px] font-medium text-slate-300 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Team Chat</span>
              </Link>
              <Link
                href="/calls"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-medium text-slate-300 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>Video Rooms</span>
              </Link>
            </div>
          </div>

          {/* Heading & Mission Briefing */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {timeGreeting}, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your AI-powered workspace is synchronized. Store unlimited files in Google Drive, collaborate in real time with team chat and video calls, and consult Gemini for intelligent sprint insights.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <StartSessionBannerButton />
              <AISummaryButton />
            </div>
          </div>

          {/* Interactive AI Prompt Quick Rail */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask Gemini 3.8 Flash with 1-click:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Where did I stop working?', href: '/ai-assistant?prompt=Where%20did%20I%20stop%20working%20on%20my%20projects%3F' },
                { label: 'What tasks remain unfinished?', href: '/ai-assistant?prompt=What%20tasks%20remain%20unfinished%20in%20my%20workspace%3F' },
                { label: 'Summarize sprint progress', href: '/ai-assistant?prompt=Summarize%20my%20recent%20sprint%20progress%20and%20work%20sessions' },
                { label: 'What should I work on next?', href: '/ai-assistant?prompt=What%20should%20I%20work%20on%20next%20based%20on%20deadlines%3F' },
              ].map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs group"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>{pill.label}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. CREATIVE BENTO METRIC MATRIX
          ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Active Projects Trajectory */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl shadow-lg hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Projects
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <FolderGit2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {activeProjects.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">pipeline</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Production roadmap</span>
            <Link href="/projects" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
              Manage &rarr;
            </Link>
          </div>
        </div>

        {/* Bento 2: Sprint Task Velocity */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl shadow-lg hover:border-sky-500/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sprint Tasks
            </span>
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {completedTasksCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">of {totalTasksCount} closed ({taskCompletionPercent}%)</span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, taskCompletionPercent)}%` }}
            />
          </div>
        </div>

        {/* Bento 3: Deep Focus Engine */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl shadow-lg hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Deep Work Logged
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {totalLoggedHours}h
            </span>
            <span className="text-xs text-slate-400 font-medium">{recentSessions.length} focus sessions</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Recorded flow time</span>
            <Link href="/sessions" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5">
              Journal &rarr;
            </Link>
          </div>
        </div>

        {/* Bento 4: Google Drive Cloud Storage */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-xl shadow-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Google Drive Cloud
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {driveConnected ? 'Active' : 'Ready'}
            </span>
            <span className="text-xs text-cyan-400 font-semibold">No 50MB limits</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Direct OAuth 2.0</span>
            <Link href="/drive" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5">
              Explore files &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. GROUND-TRUTH RESUME DECK: "PICK UP WHERE YOU STOPPED"
          ========================================================================= */}
      {resumeProject && (
        <section className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-purple-950/30 border border-indigo-500/30 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Ground-Truth Project Memory
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-300">{resumeProject.name}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Pick up where you left off:
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed italic bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                &quot;{stoppingPointNote}&quot;
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/projects/${resumeProject.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer group"
              >
                <span>Jump Back In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          4. PERFORMANCE & CRM VELOCITY CHART
          ========================================================================= */}
      <CrmVelocityChart
        totalHours={parseFloat(totalLoggedHours) || 0}
        completedTasks={completedTasksCount}
        streakDays={5}
      />

      {/* =========================================================================
          5. ACTIVE PROJECTS BENTO SHOWCASE
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              Workspace Projects Portfolio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production codebases, roadmaps, linked Google Drive folders, and stopping points
            </p>
          </div>
          <Link
            href="/projects"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>All projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">No active projects yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first project to organize tasks, work sessions, stopping points, and Google Drive files.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProjects.slice(0, 6).map((project) => {
              const latestSession = recentSessions.find((s) => s.project_id === project.id);
              return (
                <div
                  key={project.id}
                  className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-md hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {project.category || 'Engineering'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {latestSession ? formatDuration(latestSession.duration_mins) : 'Active'}
                      </span>
                    </div>

                    <Link href={`/projects/${project.id}`}>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {project.description || 'Sprint roadmap with task tracking, milestones, and Google Drive cloud storage.'}
                    </p>

                    {/* Continuation / Stopping Point */}
                    {(latestSession?.work_completed || project.next_action) && (
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                        <span className="font-semibold text-indigo-400 block text-[11px] mb-0.5">
                          Stopping Point:
                        </span>
                        <span className="line-clamp-1 text-slate-400">{latestSession?.work_completed || project.next_action}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Open Link */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-200">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-slate-200 font-semibold">{project.status}</strong>
                      </span>

                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Open project</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          6. SPRINT RADAR: DEADLINES & RECENT WORK JOURNAL
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="p-6 bg-slate-900/70 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Sprint Deadlines</span>
            </h3>
            <Link href="/tasks" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              Task Board &rarr;
            </Link>
          </div>

          {overdueTasksCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{overdueTasksCount} overdue task(s) require attention</span>
            </div>
          )}

          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No upcoming task deadlines scheduled.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{task.title}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Priority: {task.priority}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-800/80 text-slate-300 font-mono text-[11px] rounded-xl border border-slate-700/80 shrink-0">
                    {formatDate(task.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Work Sessions Journal */}
        <div className="p-6 bg-slate-900/70 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Work Journal &amp; Stopping Points</span>
            </h3>
            <Link href="/sessions" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              Session History &rarr;
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No work sessions logged yet. Use &quot;Start Session&quot; to track your deep work!
            </p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{session.title}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {formatDate(session.start_time)} ({formatDuration(session.duration_mins)})
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-1">
                    {session.work_completed || 'Focused work session'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
