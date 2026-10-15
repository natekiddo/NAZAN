'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ChatMessageItem } from '@/types';
import { getEffectivePermissions, hasPermission } from '@/lib/permissions';

export async function getWorkspaceChatMessages(
  workspaceId: string,
  projectId?: string | null
): Promise<{ messages: ChatMessageItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], error: 'Unauthorized: User not authenticated' };
  }

  // Verify workspace membership
  const db = createAdminClient() || supabase;
  const { data: member } = await db
    .from('workspace_members')
    .select('role, custom_permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return { messages: [], error: 'Access denied: You are not a member of this workspace' };
  }

  try {
    let query = db
      .from('chat_messages')
      .select('*, profile:profiles(*), project:projects(name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query;
    if (error) {
      // If table doesn't exist yet, return graceful empty list
      if (error.code === 'PGRST205' || error.message?.includes('not find')) {
        return { messages: [] };
      }
      return { messages: [], error: error.message };
    }

    return { messages: (data as any) || [] };
  } catch (err: any) {
    return { messages: [], error: err?.message || 'Failed to fetch messages' };
  }
}

export async function sendChatMessageAction(
  workspaceId: string,
  content: string,
  projectId?: string | null,
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>
): Promise<{ success: boolean; message?: ChatMessageItem; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: User not authenticated' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty' };
  }

  // Verify permissions
  const db = createAdminClient() || supabase;
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
  if (!effective.can_send_messages) {
    return { success: false, error: 'Permission denied: You do not have permission to post chat messages' };
  }

  try {
    const { data, error } = await db
      .from('chat_messages')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId || null,
        user_id: user.id,
        content: trimmed,
        attachments: attachments || [],
      } as any)
      .select('*, profile:profiles(*), project:projects(name)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await db.from('activity_logs').insert({
      user_id: user.id,
      action: 'posted_chat_message',
      entity_type: 'chat',
      entity_id: data.id,
      details: {
        workspace_id: workspaceId,
        project_id: projectId,
        preview: trimmed.slice(0, 60),
      },
    } as any);

    revalidatePath('/chat');
    return { success: true, message: data as any };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message' };
  }
}
