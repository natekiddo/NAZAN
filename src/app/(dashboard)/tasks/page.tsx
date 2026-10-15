'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Kanban,
  List,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getProjects } from '@/lib/actions/projects';
import { Task, Project, TaskStatus, TaskPriority } from '@/types';
import TaskKanban from '@/components/tasks/TaskKanban';
import TaskList from '@/components/tasks/TaskList';
import TaskFormModal from '@/components/tasks/TaskFormModal';

export default function TasksPage() {
  const [tasks, setTasks] = useState<(Task & { project?: Project | null })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus | undefined>(undefined);

  const fetchTasksAndProjects = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Fetch Projects for filter dropdown (personal + shared workspace projects)
      const { projects: projList } = await getProjects();
      setProjects(projList || []);

      const projectIds = (projList || []).map((p) => p.id);

      // 2. Fetch Tasks with Project join (user's tasks + shared project tasks)
      let taskQuery = supabase
        .from('tasks')
        .select('*, project:projects(*)')
        .order('created_at', { ascending: false });

      if (projectIds.length > 0) {
        taskQuery = taskQuery.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')})`);
      } else {
        taskQuery = taskQuery.eq('user_id', user.id);
      }

      const { data: taskData, error } = await taskQuery;
      if (!error && taskData) {
        setTasks(taskData as unknown as (Task & { project?: Project | null })[]);
      } else {
        // Fallback to own tasks
        const { data: fallbackTasks } = await supabase
          .from('tasks')
          .select('*, project:projects(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setTasks((fallbackTasks as unknown as (Task & { project?: Project | null })[]) || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasksAndProjects();
  }, []);

  const handleOpenCreate = (status?: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatusForNew(status);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setDefaultStatusForNew(undefined);
    fetchTasksAndProjects();
  };

  // Filter Tasks
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.project?.name && t.project.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProject = projectFilter === 'All' || t.project_id === projectFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });

  // KPI counts
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const dueTodayCount = tasks.filter((t) => t.due_date === todayStr && t.status !== 'Completed').length;
  const overdueCount = tasks.filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== 'Completed'
  ).length;

  return (
    <div className="workspace-page space-y-7 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">Stay in motion</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A clear view of the next steps across your projects.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="workspace-primary-button self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New task
        </button>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="workspace-panel flex items-center justify-between !p-4">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Total Tasks</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
          </div>
          <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"><CheckSquare className="w-5 h-5" /></span>
        </div>

        <div className="workspace-panel flex items-center justify-between !p-4">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Due Today</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{dueTodayCount}</p>
          </div>
          <span className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Calendar className="w-5 h-5" /></span>
        </div>

        <div className="workspace-panel flex items-center justify-between !p-4">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Overdue</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</p>
          </div>
          <span className="rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><AlertCircle className="w-5 h-5" /></span>
        </div>

        <div className="workspace-panel flex items-center justify-between !p-4">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Completed</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </p>
          </div>
          <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /></span>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="workspace-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 !p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, project, description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Kanban / List View Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Board / List View */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : viewMode === 'kanban' ? (
        <TaskKanban
          tasks={filteredTasks}
          onEditTask={handleOpenEdit}
          onAddTask={handleOpenCreate}
          onRefresh={fetchTasksAndProjects}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onEditTask={handleOpenEdit}
          onRefresh={fetchTasksAndProjects}
        />
      )}

      {/* Task Creation / Edit Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        projects={projects}
      />
    </div>
  );
}
