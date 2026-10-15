'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Clock, FolderGit2, CheckSquare, Loader2 } from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { createClient } from '@/lib/supabase/client';
import { Project, Task } from '@/types';

export default function StartSessionDialog() {
  const { isStartDialogOpen, closeStartDialog, startTimer, defaultProjectId } = useSessionTimer();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch active projects on open
  useEffect(() => {
    if (!isStartDialogOpen) return;

    async function loadProjects() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'Archived')
          .order('name');

        const projs = (data as unknown as Project[]) || [];
        setProjects(projs);

        if (defaultProjectId && projs.some((p) => p.id === defaultProjectId)) {
          setSelectedProjectId(defaultProjectId);
        } else if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        }
      }
      setLoading(false);
    }

    loadProjects();
  }, [isStartDialogOpen, defaultProjectId]);

  // Load tasks for chosen project
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    async function loadTasks() {
      const supabase = createClient();
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', selectedProjectId)
        .neq('status', 'Completed')
        .order('title');

      setTasks((data as unknown as Task[]) || []);
    }

    loadTasks();
  }, [selectedProjectId]);

  if (!isStartDialogOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const chosenProj = projects.find((p) => p.id === selectedProjectId);
    const chosenTask = tasks.find((t) => t.id === selectedTaskId);

    const title =
      sessionTitle.trim() ||
      (chosenTask ? `Work on: ${chosenTask.title}` : `Work Session on ${chosenProj?.name || 'Project'}`);

    startTimer({
      projectId: selectedProjectId,
      projectName: chosenProj?.name || 'Project',
      taskId: selectedTaskId || null,
      taskTitle: chosenTask?.title || null,
      title,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Start Live Work Session
              </h2>
              <p className="text-xs text-slate-500">Track real time while developing or studying</p>
            </div>
          </div>
          <button
            onClick={closeStartDialog}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Project Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                Select Project <span className="text-rose-500">*</span>
              </label>
              {projects.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  Please create a project first before starting a session.
                </p>
              ) : (
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTaskId('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'General'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional Task Picker */}
            {tasks.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  Related Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- No specific task --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Session Title / Intention */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Focus / Title (Optional)
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Implement Supabase Auth SSR and middleware"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={closeStartDialog}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={projects.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Start Live Timer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
