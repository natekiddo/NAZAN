'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Plus, CheckCircle2, Circle, Trash2, Calendar, Loader2 } from 'lucide-react';
import { Milestone, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { createMilestone, toggleMilestone, deleteMilestone } from '@/lib/actions/milestones';

interface ProjectMilestonesTabProps {
  project: Project;
  milestones: Milestone[];
}

export default function ProjectMilestonesTab({ project, milestones }: ProjectMilestonesTabProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await createMilestone({
      project_id: project.id,
      title,
      description: description || undefined,
      due_date: dueDate || undefined,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setShowAddForm(false);
    setLoading(false);
    router.refresh();
  };

  const handleToggle = async (milestone: Milestone) => {
    await toggleMilestone(milestone.id, !milestone.completed, project.id);
    router.refresh();
  };

  const handleDelete = async (milestone: Milestone) => {
    if (confirm(`Delete milestone "${milestone.title}"?`)) {
      await deleteMilestone(milestone.id, project.id);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-500" />
            Milestones &amp; Roadmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define major target milestones and delivery phases for this project.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddMilestone}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs"
        >
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">New Milestone</h4>
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Beta Release v1.0"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Target Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of this milestone..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-semibold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Milestone'}
            </button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Flag className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">No milestones yet</h4>
          <p className="text-xs text-slate-500">
            Keep your semester and software deliverables organized with scheduled milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(m)}
                  className="p-1 text-slate-400 hover:text-indigo-500"
                >
                  {m.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50 dark:fill-indigo-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      m.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {m.title}
                  </h4>
                  {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                {m.due_date && (
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(m.due_date)}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(m)}
                  className="p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
