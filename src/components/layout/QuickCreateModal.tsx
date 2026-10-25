'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, FolderGit2, CheckSquare, Plus, Loader2, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSessionTimer } from '@/context/SessionTimerContext';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const { openStartDialog } = useSessionTimer();
  const [activeTab, setActiveTab] = useState<'task' | 'project'>('task');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectCategory, setProjectCategory] = useState('Full-Stack Web');
  const [projectPriority, setProjectPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  if (!isOpen) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: taskTitle,
        priority: taskPriority,
        due_date: taskDueDate || null,
        status: 'To Do',
      } as any);
    }

    setLoading(false);
    onClose();
    router.refresh();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('projects').insert({
        user_id: user.id,
        name: projectName,
        category: projectCategory,
        priority: projectPriority,
        status: 'In Progress',
      } as any);
    }

    setLoading(false);
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-google">
            <span className="p-1 rounded-lg bg-brand-50 text-brand-500 dark:bg-slate-800 dark:text-saffron-400">
              <Plus className="w-4 h-4" />
            </span>
            Quick create
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('task')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'task'
                ? 'bg-slate-900 text-white shadow-xs font-bold dark:bg-saffron-400 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            New Task
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === 'project'
                ? 'bg-slate-900 text-white shadow-xs font-bold dark:bg-saffron-400 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            New Project
          </button>

          <button
            onClick={() => {
              onClose();
              openStartDialog();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-full text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-saffron-500" />
            Work session
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Add keyboard navigation"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Milestone Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-brand-900 dark:bg-saffron-400 dark:hover:bg-saffron-400 dark:text-slate-900 text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'project' && (
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Personal portfolio redesign"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    placeholder="e.g. Artificial Intelligence"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-brand-900 dark:bg-saffron-400 dark:hover:bg-saffron-400 dark:text-slate-900 text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
