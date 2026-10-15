'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ProjectNote } from '@/types';

export interface CreateNoteInput {
  project_id: string;
  title: string;
  content: string;
  tags?: string[];
}

export async function createProjectNote(input: CreateNoteInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { data, error } = await supabase
    .from('project_notes')
    .insert({
      user_id: user.id,
      project_id: input.project_id,
      title: input.title,
      content: input.content,
      tags: input.tags || [],
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${input.project_id}`);
  return { note: data as ProjectNote };
}

export async function deleteProjectNote(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { error } = await supabase
    .from('project_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
