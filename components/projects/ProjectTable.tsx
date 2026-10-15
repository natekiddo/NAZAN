'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';
import { deleteProject } from '@/lib/actions/projects';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
}

export default function ProjectTable({ projects, onEdit }: ProjectTableProps) {
  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject(project.id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Project Name</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Priority</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Progress</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Deadline</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                  <Link href={`/projects/${p.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    {p.name}
                  </Link>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                    {p.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">{p.priority}</td>
                <td className="py-3.5 px-4 text-slate-500">{p.category || 'General'}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px]">{p.progress}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-500">{formatDate(p.deadline)}</td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline" />
                  </button>
                  <Link
                    href={`/projects/${p.id}`}
                    className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title="View details"
                  >
                    <ArrowRight className="w-3.5 h-3.5 inline" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
