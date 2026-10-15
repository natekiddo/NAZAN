'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Task, TaskStatus, TaskPriority } from '@/types';

export interface CreateTaskInput {
  project_id?: string | null;
  milestone_id?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string | null;
  due_date?: string | null;
  estimated_duration_mins?: number | null;
  actual_duration_mins?: number | null;
  tags?: string[];
  notes?: string | null;
}

// Helper to recalculate and synchronize project progress
async function syncProjectProgress(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (!tasks || tasks.length === 0) return;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = Math.round((completed / total) * 100);

  await supabase
    .from('projects')
    .update({ progress: progressPercent, updated_at: new Date().toISOString() } as any)
    .eq('id', projectId)
    .eq('user_id', userId);
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      project_id: input.project_id || null,
      milestone_id: input.milestone_id || null,
      title: input.title,
      description: input.description || null,
      status: input.status || 'To Do',
      priority: input.priority || 'Medium',
      start_date: input.start_date || null,
      due_date: input.due_date || null,
      estimated_duration_mins: input.estimated_duration_mins || null,
      actual_duration_mins: input.actual_duration_mins || null,
      tags: input.tags || [],
      notes: input.notes || null,
      completed_at: input.status === 'Completed' ? new Date().toISOString() : null,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (input.project_id) {
    await syncProjectProgress(input.project_id, user.id);
    revalidatePath(`/projects/${input.project_id}`);
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { task: data as Task };
}

export async function updateTask(id: string, input: Partial<CreateTaskInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const updatePayload: Record<string, any> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (input.status) {
    if (input.status === 'Completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (data.project_id) {
    await syncProjectProgress(data.project_id, user.id);
    revalidatePath(`/projects/${data.project_id}`);
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { task: data as Task };
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus) {
  return updateTask(id, { status: newStatus });
}

export async function deleteTask(id: string, projectId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  if (projectId) {
    await syncProjectProgress(projectId, user.id);
    revalidatePath(`/projects/${projectId}`);
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  return { success: true };
}
