'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Project, ProjectStatus, ProjectPriority } from '@/types';

export interface CreateProjectInput {
  name: string;
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

  const { data, error } = await supabase
    .from('projects')
    .insert({
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
    } as any)
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
    details: { name: data.name },
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

  const updatePayload: Record<string, any> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

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

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

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
