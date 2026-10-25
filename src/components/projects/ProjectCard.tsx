'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  Calendar,
  ArrowRight,
  Archive,
  Trash2,
  Edit,
  ExternalLink,
  Award,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteProject, archiveProject } from '@/lib/actions/projects';

interface ProjectCardProps {
  project: Project & { taskCount?: number; completedCount?: number };
  onEdit: (project: Project) => void;
}

export default function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      setDeleting(true);
      await deleteProject(project.id);
    }
  };

  const handleArchive = async () => {
    const isArchived = project.status === 'Archived';
    await archiveProject(project.id, !isArchived);
    setShowMenu(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In Progress':
        return 'bg-brand-50 dark:bg-slate-800 text-brand-500 dark:text-saffron-400 border-brand-100 dark:border-brand-700';
      case 'On Hold':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Planning':
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800';
      case 'Archived':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="workspace-project-card relative justify-between space-y-4 group">
      {/* Top Header Tags */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(
                project.status
              )}`}
            >
              {project.status}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {project.category || 'Engineering'}
            </span>
          </div>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-1.5 text-xs animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(project);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                  Edit project
                </button>
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  {project.status === 'Archived' ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-slate-800 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/projects/${project.id}`}>
          <h3 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-brand-500 dark:group-hover:text-saffron-400 transition-colors line-clamp-1">
            {project.name}
          </h3>
        </Link>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {/* Progress Bar with Google Gradient */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="text-slate-900 dark:text-white font-bold">{project.progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-brand-300 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
          />
        </div>
      </div>

      {/* Tech Stack Badges */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-medium"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-medium">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stopping Point / Next Action */}
      {project.next_action && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-brand-500 dark:text-saffron-400 flex items-center gap-1 mb-0.5">
            Next up
          </span>
          <span className="line-clamp-1">{project.next_action}</span>
        </div>
      )}

      {/* Footer Info & Explore Button */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{project.deadline ? formatDate(project.deadline) : 'Ongoing sprint'}</span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-900 cursor-pointer dark:bg-saffron-400 dark:text-slate-900 dark:hover:bg-saffron-400"
        >
          <span>Open project</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
