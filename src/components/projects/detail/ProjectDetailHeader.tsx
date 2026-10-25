'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  GitBranch,
  Globe,
  Edit,
  Trash2,
  Archive,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteProject, archiveProject } from '@/lib/actions/projects';
import ProjectFormModal from '@/components/projects/ProjectFormModal';

interface ProjectDetailHeaderProps {
  project: Project;
  taskStats: { total: number; completed: number };
}

export default function ProjectDetailHeader({ project, taskStats }: ProjectDetailHeaderProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Delete project "${project.name}" permanently?`)) {
      await deleteProject(project.id);
      router.push('/projects');
      router.refresh();
    }
  };

  const handleArchive = async () => {
    const isArchived = project.status === 'Archived';
    await archiveProject(project.id, !isArchived);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
      </div>

      {/* Main Header Container */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {project.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {project.category || 'General'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Priority: {project.priority}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Repository"
              >
                <GitBranch className="w-4 h-4" />
              </a>
            )}

            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Live Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>

            <button
              onClick={handleArchive}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title={project.status === 'Archived' ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Task Progress</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {project.progress}% ({taskStats.completed}/{taskStats.total} done)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Deadline: {project.deadline ? formatDate(project.deadline) : 'No deadline'}
              </p>
              <p className="text-[11px] text-slate-400">
                Started: {project.start_date ? formatDate(project.start_date) : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Last Worked: {formatDate(project.last_worked_at || project.updated_at)}
              </p>
              <p className="text-[11px] text-slate-400">
                Status: {project.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          router.refresh();
        }}
        project={project}
      />
    </div>
  );
}
