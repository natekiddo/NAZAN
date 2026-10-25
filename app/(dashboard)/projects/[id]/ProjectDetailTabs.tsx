'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Flag,
  FileText,
  Clock,
  FolderGit2,
} from 'lucide-react';
import { Project, Task, Milestone, ProjectNote, WorkSession, FileItem, Folder } from '@/types';
import ProjectOverviewTab from '@/components/projects/detail/ProjectOverviewTab';
import ProjectTasksTab from '@/components/projects/detail/ProjectTasksTab';
import ProjectMilestonesTab from '@/components/projects/detail/ProjectMilestonesTab';
import ProjectNotesTab from '@/components/projects/detail/ProjectNotesTab';
import ProjectHistoryTab from '@/components/projects/detail/ProjectHistoryTab';
import ProjectFilesTab from '@/components/projects/detail/ProjectFilesTab';

interface ProjectDetailTabsProps {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  notes: ProjectNote[];
  sessions: WorkSession[];
  files?: FileItem[];
  folders?: Folder[];
}

export default function ProjectDetailTabs({
  project,
  tasks,
  milestones,
  notes,
  sessions,
  files = [],
  folders = [],
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'notes' | 'files' | 'history'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
    { id: 'milestones', label: `Milestones (${milestones.length})`, icon: Flag },
    { id: 'files', label: `Files (${files.length})`, icon: FolderGit2 },
    { id: 'notes', label: `Notes (${notes.length})`, icon: FileText },
    { id: 'history', label: `Work History (${sessions.length})`, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'overview' && (
          <ProjectOverviewTab project={project} tasks={tasks} sessions={sessions} />
        )}
        {activeTab === 'tasks' && <ProjectTasksTab project={project} tasks={tasks} />}
        {activeTab === 'milestones' && (
          <ProjectMilestonesTab project={project} milestones={milestones} />
        )}
        {activeTab === 'files' && (
          <ProjectFilesTab project={project} files={files} folders={folders} />
        )}
        {activeTab === 'notes' && <ProjectNotesTab project={project} notes={notes} />}
        {activeTab === 'history' && <ProjectHistoryTab project={project} sessions={sessions} />}
      </div>
    </div>
  );
}
