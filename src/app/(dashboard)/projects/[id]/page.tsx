import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Project, Task, Milestone, ProjectNote, WorkSession, FileItem, Folder } from '@/types';
import ProjectDetailHeader from '@/components/projects/detail/ProjectDetailHeader';
import ProjectDetailTabs from './ProjectDetailTabs';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // 1. Fetch Project
  const { data: projectData, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !projectData) {
    notFound();
  }

  const project = projectData as unknown as Project;

  // 2. Fetch Tasks, Milestones, Notes, Sessions, Files, Folders in parallel
  const [tasksRes, milestonesRes, notesRes, sessionsRes, filesRes, foldersRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('work_sessions')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false }),
    supabase
      .from('files')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .eq('is_trashed', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .or(`project_id.eq.${id},project_id.is.null`)
      .order('name', { ascending: true }),
  ]);

  const tasks = (tasksRes.data as unknown as Task[]) || [];
  const milestones = (milestonesRes.data as unknown as Milestone[]) || [];
  const notes = (notesRes.data as unknown as ProjectNote[]) || [];
  const sessions = (sessionsRes.data as unknown as WorkSession[]) || [];
  const files = (filesRes.data as unknown as FileItem[]) || [];
  const folders = (foldersRes.data as unknown as Folder[]) || [];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ProjectDetailHeader project={project} taskStats={taskStats} />

      <ProjectDetailTabs
        project={project}
        tasks={tasks}
        milestones={milestones}
        notes={notes}
        sessions={sessions}
        files={files}
        folders={folders}
      />
    </div>
  );
}
