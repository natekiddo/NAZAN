'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  FolderGit2,
  CheckSquare,
  FileCode,
  AlertTriangle,
  Lightbulb,
  Target,
  Edit3,
  Trash2,
  Loader2,
  Calendar,
} from 'lucide-react';
import { WorkSession } from '@/types';
import { formatDate, formatDuration } from '@/lib/utils';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { deleteWorkSession } from '@/lib/actions/sessions';

interface SessionCardProps {
  session: WorkSession & {
    project?: { name: string } | null;
    task?: { title: string } | null;
  };
  onDeleted?: () => void;
}

export default function SessionCard({ session, onDeleted }: SessionCardProps) {
  const { openEditModal } = useSessionTimer();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete session "${session.title}"?`)) {
      setIsDeleting(true);
      await deleteWorkSession(session.id, session.project_id);
      setIsDeleting(false);
      onDeleted?.();
    }
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800/70 transition-all">
      {/* Header: Project / Task / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {session.project?.name && (
            <Link
              href={`/projects/${session.project_id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              {session.project.name}
            </Link>
          )}

          {session.task?.title && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200/60 dark:border-blue-800/40">
              <CheckSquare className="w-3 h-3" />
              {session.task.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(session.start_time)}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatDuration(session.duration_mins)}</span>
          </div>

          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => openEditModal(session)}
              title="Edit session"
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete session"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Session Title */}
      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
        {session.title}
      </h3>

      {/* Work Completed */}
      {session.work_completed && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            Work Completed:
          </span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pl-5">
            {session.work_completed}
          </p>
        </div>
      )}

      {/* Stopping Point & Next Action Callout */}
      {session.next_action && (
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 text-xs space-y-1">
          <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Next Action:
          </span>
          <p className="text-indigo-900 dark:text-indigo-300 font-medium pl-5">
            {session.next_action}
          </p>
        </div>
      )}

      {/* Problems / Blockers */}
      {session.problems_encountered && (
        <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/70 dark:border-rose-800/50 text-xs space-y-1">
          <span className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Problems &amp; Blockers:
          </span>
          <p className="text-rose-700 dark:text-rose-300/90 pl-5">
            {session.problems_encountered}
          </p>
        </div>
      )}

      {/* Decisions Made */}
      {session.decisions_made && (
        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/50 text-xs space-y-1">
          <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Decisions Made:
          </span>
          <p className="text-amber-900 dark:text-amber-300/90 pl-5">
            {session.decisions_made}
          </p>
        </div>
      )}

      {/* Files Worked On */}
      {session.files_worked_on && session.files_worked_on.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <FileCode className="w-3 h-3" />
            Files &amp; Components:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {session.files_worked_on.map((file) => (
              <span
                key={file}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notes */}
      {session.personal_notes && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800/80">
          Note: {session.personal_notes}
        </div>
      )}
    </div>
  );
}
