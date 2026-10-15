'use client';

import React from 'react';
import {
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  FolderGit2,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks';

interface TaskKanbanProps {
  tasks: (Task & { project?: Project | null })[];
  onEditTask: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
  onRefresh: () => void;
}

const columns: { status: TaskStatus; label: string; dotColor: string }[] = [
  { status: 'Backlog', label: 'Backlog', dotColor: 'bg-slate-400' },
  { status: 'To Do', label: 'To Do', dotColor: 'bg-indigo-400' },
  { status: 'In Progress', label: 'In Progress', dotColor: 'bg-indigo-600' },
  { status: 'Blocked', label: 'Blocked', dotColor: 'bg-rose-500' },
  { status: 'Completed', label: 'Completed', dotColor: 'bg-emerald-600' },
];

export default function TaskKanban({
  tasks,
  onEditTask,
  onAddTask,
  onRefresh,
}: TaskKanbanProps) {
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
    onRefresh();
  };

  const handleDelete = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      await deleteTask(task.id, task.project_id);
      onRefresh();
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'High':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Medium':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 min-w-[240px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {col.label}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onAddTask(col.status)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={`Add task to ${col.label}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Tasks */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
              {colTasks.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-400">
                  Empty
                </div>
              ) : (
                colTasks.map((task) => {
                  const isOverdue =
                    task.due_date &&
                    task.due_date < new Date().toISOString().split('T')[0] &&
                    task.status !== 'Completed';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5 group"
                    >
                      {/* Priority and Project */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="p-1 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <p className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                        {task.title}
                      </p>

                      {/* Project Name */}
                      {task.project?.name && (
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                          <FolderGit2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{task.project.name}</span>
                        </div>
                      )}

                      {/* Due date */}
                      {task.due_date && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-mono ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(task.due_date)}</span>
                          {isOverdue && <span>(Overdue)</span>}
                        </div>
                      )}

                      {/* Quick Move Select */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Move:</span>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          {columns.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
