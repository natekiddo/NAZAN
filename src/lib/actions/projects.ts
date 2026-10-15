'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Project, ProjectStatus, ProjectPriority } from '@/types';
import { getWorkspaceMembers } from '@/lib/actions/workspaces';

export interface CreateProjectInput {
  name: string;
  workspace_id?: string | null;
  description?: string;
  category?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  start_date?: string | null;
  deadline?: string | null;
  technologies?: string[];
  repo_url?: string | null;
  live_url?: string | null;
  documentation?: string | null;
  notes?: string | null;
  next_action?: string | null;
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // Determine workspace association and verify permissions
  const cookieStore = await cookies();
  const activeWsId = input.workspace_id || cookieStore.get('projecthub_active_workspace')?.value || null;

  if (activeWsId && !activeWsId.startsWith('ws-')) {
    const { userPermissions, isOwner } = await getWorkspaceMembers(activeWsId);
    if (!isOwner && !userPermissions.can_create_projects) {
      return { error: 'You do not have permission to create projects in this workspace' };
    }
  }

  const projectPayload: Record<string, any> = {
    user_id: user.id,
    name: input.name,
    description: input.description || null,
    category: input.category || 'General',
    priority: input.priority || 'Medium',
    status: input.status || 'In Progress',
    start_date: input.start_date || null,
    deadline: input.deadline || null,
    technologies: input.technologies || [],
    repo_url: input.repo_url || null,
    live_url: input.live_url || null,
    documentation: input.documentation || null,
    notes: input.notes || null,
    next_action: input.next_action || null,
    progress: 0,
  };

  if (activeWsId && !activeWsId.startsWith('ws-')) {
    projectPayload.workspace_id = activeWsId;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(projectPayload as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'created_project',
    entity_type: 'project',
    entity_id: data.id,
    details: { name: data.name, workspace_id: projectPayload.workspace_id },
  } as any);

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return { project: data as Project };
}

export async function updateProject(id: string, input: Partial<CreateProjectInput> & { progress?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // 1. Verify project access & permissions
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, user_id, workspace_id')
    .eq('id', id)
    .single();

  if (!existingProject) {
    return { error: 'Project not found' };
  }

  const isCreator = existingProject.user_id === user.id;
  if (!isCreator && existingProject.workspace_id) {
    const { userPermissions, isOwner } = await getWorkspaceMembers(existingProject.workspace_id);
    if (!isOwner && !userPermissions.can_edit_projects) {
      return { error: 'You do not have permission to edit projects in this workspace' };
    }
  }

  const updatePayload: Record<string, any> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from('projects').update(updatePayload as any).eq('id', id);
  if (isCreator) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return { project: data as Project };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // Verify deletion permission
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, user_id, workspace_id')
    .eq('id', id)
    .single();

  if (!existingProject) {
    return { error: 'Project not found' };
  }

  const isCreator = existingProject.user_id === user.id;
  if (!isCreator && existingProject.workspace_id) {
    const { userPermissions, isOwner } = await getWorkspaceMembers(existingProject.workspace_id);
    if (!isOwner && !userPermissions.can_delete_projects) {
      return { error: 'You do not have permission to delete projects in this workspace' };
    }
  }

  let query = supabase.from('projects').delete().eq('id', id);
  if (isCreator) {
    query = query.eq('user_id', user.id);
  }

  const { error } = await query;

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function archiveProject(id: string, isArchived: boolean = true) {
  const nextStatus: ProjectStatus = isArchived ? 'Archived' : 'In Progress';
  return updateProject(id, { status: nextStatus });
}

export async function getProjects(): Promise<{ projects: Project[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { projects: [], error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    const { data: ownData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    return { projects: (ownData as unknown as Project[]) || [] };
  }

  return { projects: (data as unknown as Project[]) || [] };
}

