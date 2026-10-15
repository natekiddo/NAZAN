'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CallSessionItem } from '@/types';
import { getEffectivePermissions } from '@/lib/permissions';

export async function getWorkspaceActiveCalls(workspaceId: string): Promise<CallSessionItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const db = createAdminClient() || supabase;
  try {
    const { data, error } = await db
      .from('call_sessions')
      .select('*, host:profiles(*), project:projects(name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function startWorkspaceCallAction(
  workspaceId: string,
  title: string,
  projectId?: string | null
): Promise<{ success: boolean; call?: CallSessionItem; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: User not authenticated' };
  }

  const db = createAdminClient() || supabase;
  // Verify permissions
  const { data: member } = await db
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return { success: false, error: 'Access denied: You are not a member of this workspace' };
  }

  const effective = getEffectivePermissions(member.role, member.custom_permissions);
  if (!effective.can_start_calls) {
    return { success: false, error: 'Permission denied: You do not have permission to initiate calls' };
  }

  const callTitle = title.trim() || 'Workspace Standup & Discussion';

  try {
    const participantData = [
      {
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Host',
        joined_at: new Date().toISOString(),
      },
    ];

    const { data, error } = await db
      .from('call_sessions')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId || null,
        host_user_id: user.id,
        title: callTitle,
        status: 'active',
        participants: participantData,
      } as any)
      .select('*, host:profiles(*), project:projects(name)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/calls');
    return { success: true, call: data as any };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to start call' };
  }
}

export async function endWorkspaceCallAction(callId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const db = createAdminClient() || supabase;
  try {
    const { error } = await db
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      } as any)
      .eq('id', callId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/calls');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to end call' };
  }
}
