import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { FileItem, Folder, Project } from '@/types';
import FileManagerView from '@/components/files/FileManagerView';
import { getProjects } from '@/lib/actions/projects';

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let files: (FileItem & { project?: { name: string } | null })[] = [];
  let folders: Folder[] = [];
  let projects: Project[] = [];

  if (user) {
    const [filesRes, foldersRes, projectsRes] = await Promise.all([
      supabase
        .from('files')
        .select('*, project:projects(name)')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
      getProjects(),
    ]);

    files = (filesRes.data as unknown as (FileItem & { project?: { name: string } | null })[]) || [];
    folders = (foldersRes.data as unknown as Folder[]) || [];
    projects = (projectsRes.projects || []).filter((p) => p.status !== 'Archived');
  }

  return (
    <FileManagerView
      initialFiles={files}
      folders={folders}
      projects={projects}
    />
  );
}
