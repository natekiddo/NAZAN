'use client';

import React from 'react';
import { Clock, Play, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WorkSession, Project } from '@/types';
import SessionCard from '@/components/sessions/SessionCard';
import { useSessionTimer } from '@/context/SessionTimerContext';

interface ProjectHistoryTabProps {
  project: Project;
  sessions: WorkSession[];
}

export default function ProjectHistoryTab({ project, sessions }: ProjectHistoryTabProps) {
  const router = useRouter();
  const { openStartDialog, openLogModal } = useSessionTimer();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Work Session History &amp; Progress Journal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological development log, accomplishments, decisions, and blockers for {project.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openStartDialog(project.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Start Live Session
          </button>
          <button
            onClick={() => openLogModal({ projectId: project.id })}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Past Session
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            No work sessions logged for this project
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Start a live session or log your hours whenever you work on this project so ProjectHub remembers where you stopped.
          </p>
          <div className="pt-2">
            <button
              onClick={() => openStartDialog(project.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Start First Session
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={{
                ...session,
                project: { name: project.name },
              }}
              onDeleted={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
