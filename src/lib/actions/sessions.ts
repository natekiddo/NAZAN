'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { WorkSession } from '@/types';

export interface CreateSessionInput {
  project_id: string;
  task_id?: string | null;
  title: string;
  start_time: string;
  end_time?: string | null;
  duration_mins: number;
  work_completed?: string | null;
  files_worked_on?: string[];
  problems_encountered?: string | null;
  decisions_made?: string | null;
  blockers?: string | null;
  next_action?: string | null;
  personal_notes?: string | null;
}

export async function createWorkSession(input: CreateSessionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // 1. Insert session
  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: user.id,
      project_id: input.project_id,
      task_id: input.task_id || null,
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time || new Date().toISOString(),
      duration_mins: input.duration_mins,
      work_completed: input.work_completed || null,
      files_worked_on: input.files_worked_on || [],
      problems_encountered: input.problems_encountered || null,
      decisions_made: input.decisions_made || null,
      blockers: input.blockers || null,
      next_action: input.next_action || null,
      personal_notes: input.personal_notes || null,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // 2. Update project's last_worked_at and next_action
  const projectUpdate: Record<string, any> = {
    last_worked_at: input.end_time || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (input.next_action) {
    projectUpdate.next_action = input.next_action;
  }

  await supabase
    .from('projects')
    .update(projectUpdate as any)
    .eq('id', input.project_id)
    .eq('user_id', user.id);

  // 3. If related to a task and work was completed, update task actual duration
  if (input.task_id) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('actual_duration_mins')
      .eq('id', input.task_id)
      .eq('user_id', user.id)
      .single();

    if (taskData) {
      const currentDuration = taskData.actual_duration_mins || 0;
      await supabase
        .from('tasks')
        .update({
          actual_duration_mins: currentDuration + input.duration_mins,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', input.task_id);
    }
  }

  // 4. Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'logged_work_session',
    entity_type: 'work_session',
    entity_id: data.id,
    details: {
      title: input.title,
      duration_mins: input.duration_mins,
      project_id: input.project_id,
    },
  } as any);

  revalidatePath('/sessions');
  revalidatePath('/dashboard');
  revalidatePath(`/projects/${input.project_id}`);
  return { session: data as WorkSession };
}

export async function updateWorkSession(id: string, input: Partial<CreateSessionInput>) {
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
    .from('work_sessions')
    .update(updatePayload as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (input.next_action && data.project_id) {
    await supabase
      .from('projects')
      .update({ next_action: input.next_action, updated_at: new Date().toISOString() } as any)
      .eq('id', data.project_id)
      .eq('user_id', user.id);
  }

  revalidatePath('/sessions');
  revalidatePath('/dashboard');
  if (data.project_id) {
    revalidatePath(`/projects/${data.project_id}`);
  }
  return { session: data as WorkSession };
}

export async function deleteWorkSession(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { error } = await supabase
    .from('work_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/sessions');
  revalidatePath('/dashboard');
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
