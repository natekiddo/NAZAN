'use client';

import React from 'react';
import { Project, Task, WorkSession } from '@/types';
import { formatDate, formatDuration } from '@/lib/utils';
import { Code2, Target, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface ProjectOverviewTabProps {
  project: Project;
  tasks: Task[];
  sessions: WorkSession[];
}

export default function ProjectOverviewTab({ project, tasks, sessions }: ProjectOverviewTabProps) {
  const latestSession = sessions[0];
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column (2 Cols) */}
      <div className="md:col-span-2 space-y-6">
        {/* Next Action Callout */}
        <div className="p-5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            Immediate Next Action
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {project.next_action || latestSession?.next_action || 'No next action set yet. Add one in project settings or during your next session.'}
          </p>
        </div>

        {/* Project Documentation & Description */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Project Documentation &amp; Scope
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {project.documentation || project.description || 'No documentation written yet for this project.'}
          </p>
        </div>

        {/* Technical Stack Details */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            Technologies &amp; Architecture
          </h3>
          {project.technologies && project.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No technologies added to this project.</p>
          )}
        </div>
      </div>

      {/* Right Column (1 Col) - Quick Stats & Status */}
      <div className="space-y-6">
        {/* Latest Work Session */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Last Work Session
          </h4>

          {latestSession ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                <span>{latestSession.title}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formatDuration(latestSession.duration_mins)}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 line-clamp-3">
                {latestSession.work_completed || 'No summary'}
              </p>
              <div className="text-[10px] text-slate-400 pt-1">
                {formatDate(latestSession.start_time)}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No work sessions logged yet.</p>
          )}
        </div>

        {/* Task Summary */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Task Health
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 block">
                {completedTasks.length}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-300">Completed</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400 block">
                {pendingTasks.length}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-300">Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
