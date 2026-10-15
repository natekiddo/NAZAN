'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit,
  Tag,
} from 'lucide-react';
import { Task, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks';
import TaskFormModal from '@/components/tasks/TaskFormModal';

interface ProjectTasksTabProps {
  project: Project;
  tasks: Task[];
}

export default function ProjectTasksTab({ project, tasks }: ProjectTasksTabProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleToggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    await updateTaskStatus(task.id, nextStatus);
    router.refresh();
  };

  const handleDelete = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      await deleteTask(task.id, project.id);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            Project Tasks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tasks in this project automatically synchronize project completion percentage.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            No tasks in this project yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Break this project into actionable items to track development progress.
          </p>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Task
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {tasks.map((task) => {
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
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
                      className={`text-sm font-semibold truncate block ${
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
                      <span>Priority: {task.priority}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          Due: {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1">
                          {task.tags.map((t) => (
                            <span key={t} className="text-slate-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setIsModalOpen(true);
                    }}
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
          })}
        </div>
      )}

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          router.refresh();
        }}
        task={editingTask}
        defaultProjectId={project.id}
      />
    </div>
  );
}
