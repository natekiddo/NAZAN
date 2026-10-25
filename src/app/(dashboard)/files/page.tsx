import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { FileItem, Folder, Project } from '@/types';
import FileManagerView from '@/components/files/FileManagerView';

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
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Archived')
        .order('name', { ascending: true }),
    ]);

    files = (filesRes.data as unknown as (FileItem & { project?: { name: string } | null })[]) || [];
    folders = (foldersRes.data as unknown as Folder[]) || [];
    projects = (projectsRes.data as unknown as Project[]) || [];
  }

  return (
    <FileManagerView
      initialFiles={files}
      folders={folders}
      projects={projects}
    />
  );
}
