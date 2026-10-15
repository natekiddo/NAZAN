'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit,
  FolderGit2,
} from 'lucide-react';
import { Task, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks';

interface TaskListProps {
  tasks: (Task & { project?: Project | null })[];
  onEditTask: (task: Task) => void;
  onRefresh: () => void;
}

export default function TaskList({ tasks, onEditTask, onRefresh }: TaskListProps) {
  const handleToggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    await updateTaskStatus(task.id, nextStatus);
    onRefresh();
  };

  const handleDelete = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      await deleteTask(task.id, task.project_id);
      onRefresh();
    }
  };

  return (
    <div className="workspace-panel !p-0 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
      {tasks.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No tasks match the selected filters.
        </div>
      ) : (
        tasks.map((task) => {
          const isCompleted = task.status === 'Completed';
          const isOverdue =
            task.due_date &&
            task.due_date < new Date().toISOString().split('T')[0] &&
            !isCompleted;

          return (
            <div
              key={task.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group text-xs"
            >
              {/* Checkbox and title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="p-1 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 hover:text-emerald-400" />
                  )}
                </button>

                <div className="truncate space-y-0.5">
                  <span
                    className={`font-semibold truncate block ${
                      isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                      {task.status}
                    </span>

                    {task.project?.name && (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                        <FolderGit2 className="w-3 h-3" />
                        {task.project.name}
                      </span>
                    )}

                    <span>Priority: {task.priority}</span>

                    {task.due_date && (
                      <span
                        className={`flex items-center gap-1 font-mono ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        Due: {formatDate(task.due_date)}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditTask(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit task"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
