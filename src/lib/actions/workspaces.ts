'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
  WorkspacePermissions,
  WorkspaceAuditLog,
} from '@/types';
import {
  getDefaultRolePermissions,
  getEffectivePermissions,
  hasPermission,
} from '@/lib/permissions';

const ACTIVE_WORKSPACE_COOKIE = 'projecthub_active_workspace';

// Fallback in-memory/cookie cache for workspaces when database schema migration is pending
interface LocalWorkspaceState {
  workspaces: Workspace[];
  members: Record<string, WorkspaceMember[]>; // workspaceId -> members
  invitations: Record<string, WorkspaceInvitation[]>;
  auditLogs: Record<string, WorkspaceAuditLog[]>;
}

/**
 * Get the currently authenticated user
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get or create the user's workspaces
 */
export async function getUserWorkspaces(): Promise<{
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isMigrationPending?: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { workspaces: [], activeWorkspaceId: '' };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeCookie = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  try {
    // 1. Query Supabase workspaces
    const { data: ownedWorkspaces, error: ownedErr } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id);

    // If table doesn't exist yet in Supabase (PGRST205), use graceful fallback
    if (ownedErr && (ownedErr.code === 'PGRST205' || ownedErr.message?.includes('not find'))) {
      return getFallbackWorkspaces(user, activeCookie);
    }

    // 2. Query workspaces where user is an invited member
    const { data: memberWorkspaces } = await supabase
      .from('workspace_members')
      .select('workspace:workspaces(*)')
      .eq('user_id', user.id);

    const memberWsList = (memberWorkspaces || [])
      .map((m: any) => m.workspace)
      .filter(Boolean) as Workspace[];

    let allWorkspaces: Workspace[] = [...((ownedWorkspaces as Workspace[]) || [])];
    for (const ws of memberWsList) {
      if (!allWorkspaces.some((w) => w.id === ws.id)) {
        allWorkspaces.push(ws);
      }
    }

    // 3. If user has no workspaces at all, auto-create a default Personal Workspace
    if (allWorkspaces.length === 0) {
      const personalName = user.user_metadata?.full_name
        ? `${user.user_metadata.full_name}'s Workspace`
        : 'Personal Workspace';

      const { data: newWs, error: createErr } = await supabase
        .from('workspaces')
        .insert({
          name: personalName,
          owner_id: user.id,
          plan: 'free',
          max_free_members: 2,
        })
        .select()
        .single();

      if (newWs && !createErr) {
        // Add owner to members table
        await supabase.from('workspace_members').insert({
          workspace_id: newWs.id,
          user_id: user.id,
          role: 'owner',
          custom_permissions: {},
        });

        allWorkspaces = [newWs as Workspace];
      }
    }

    const activeId =
      activeCookie && allWorkspaces.some((w) => w.id === activeCookie)
        ? activeCookie
        : allWorkspaces[0]?.id || '';

    return {
      workspaces: allWorkspaces,
      activeWorkspaceId: activeId,
      isMigrationPending: false,
    };
  } catch (err) {
    console.warn('Error querying workspaces from Supabase, falling back:', err);
    return getFallbackWorkspaces(user, activeCookie);
  }
}

/**
 * Fallback workspace generator when PostgreSQL migration is waiting to be run
 */
function getFallbackWorkspaces(user: any, activeCookie?: string) {
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Personal';
  const defaultWorkspace: Workspace = {
    id: `ws-${user.id}`,
    name: `${userName}'s Workspace`,
    owner_id: user.id,
    plan: 'free',
    max_free_members: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    workspaces: [defaultWorkspace],
    activeWorkspaceId: activeCookie || defaultWorkspace.id,
    isMigrationPending: true,
  };
}

/**
 * Set the currently active workspace ID in cookie
 */
export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false,
    sameSite: 'lax',
  });

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath('/tasks');
  revalidatePath('/workspace/members');
  return { success: true };
}

/**
 * Create a new shared workspace
 */
export async function createWorkspace(name: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized: Session expired' };

  if (!name.trim()) return { error: 'Workspace name is required' };

  const supabase = await createClient();

  try {
    const { data: newWs, error } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        owner_id: user.id,
        plan: 'free',
        max_free_members: 2,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Add creator as owner in workspace_members
    await supabase.from('workspace_members').insert({
      workspace_id: newWs.id,
      user_id: user.id,
      role: 'owner',
      custom_permissions: {},
    });

    await setActiveWorkspace(newWs.id);
    return { success: true, workspace: newWs as Workspace };
  } catch (err: any) {
    return { error: err.message || 'Failed to create workspace' };
  }
}

/**
 * Fetch all members of a workspace with their effective permissions
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<{
  members: WorkspaceMember[];
  userRole: WorkspaceRole;
  userPermissions: WorkspacePermissions;
  isOwner: boolean;
  memberCount: number;
  maxFreeMembers: number;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      members: [],
      userRole: 'guest',
      userPermissions: getDefaultRolePermissions('guest'),
      isOwner: false,
      memberCount: 0,
      maxFreeMembers: 2,
      error: 'Unauthorized',
    };
  }

  const supabase = await createClient();

  try {
    // 1. Fetch workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    // 2. Fetch members with profiles
    const { data: membersData, error: memErr } = await supabase
      .from('workspace_members')
      .select('*, profile:profiles(*)')
      .eq('workspace_id', workspaceId);

    if (memErr && (memErr.code === 'PGRST205' || memErr.message?.includes('not find'))) {
      // Fallback response
      const fallbackMember: WorkspaceMember = {
        id: `mem-${user.id}`,
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Owner',
          avatar_url: null,
          theme: 'light',
          time_zone: 'UTC',
          email_notifications: true,
          in_app_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      return {
        members: [fallbackMember],
        userRole: 'owner',
        userPermissions: getDefaultRolePermissions('owner'),
        isOwner: true,
        memberCount: 1,
        maxFreeMembers: 2,
      };
    }

    const members = (membersData as unknown as WorkspaceMember[]) || [];
    const currentMember = members.find((m) => m.user_id === user.id);
    const isOwner = workspace?.owner_id === user.id || currentMember?.role === 'owner';
    const userRole = isOwner ? 'owner' : currentMember?.role || 'member';
    const userPermissions = getEffectivePermissions(userRole, currentMember?.custom_permissions);

    return {
      members,
      userRole,
      userPermissions,
      isOwner,
      memberCount: members.length,
      maxFreeMembers: workspace?.max_free_members || 2,
    };
  } catch (err: any) {
    return {
      members: [],
      userRole: 'guest',
      userPermissions: getDefaultRolePermissions('guest'),
      isOwner: false,
      memberCount: 0,
      maxFreeMembers: 2,
      error: err.message,
    };
  }
}

/**
 * Fetch pending and historical invitations for a workspace
 */
export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*, inviter:profiles(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as unknown as WorkspaceInvitation[]) || [];
  } catch {
    return [];
  }
}

/**
 * Send an email invitation to collaborate in a workspace
 * Enforces the Free 2-Member Limit on the server!
 */
export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = 'member'
): Promise<{ success?: boolean; error?: string; requiresUpgrade?: boolean; token?: string; inviteUrl?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized: Session expired' };

  const targetEmail = email.trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    return { error: 'Please provide a valid email address' };
  }

  const supabase = await createClient();

  // 1. Check permissions of caller
  const { data: callerMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  const isOwner = workspace?.owner_id === user.id;
  const callerRole = isOwner ? 'owner' : callerMember?.role || 'member';
  const callerPerms = getEffectivePermissions(callerRole, callerMember?.custom_permissions);

  if (!isOwner && !callerPerms.can_invite_members) {
    return { error: 'Only the workspace owner can invite friends unless they grant that permission' };
  }

  if (role === 'owner') {
    return { error: 'Ownership cannot be shared through an invite link. The creator keeps full control.' };
  }

  // 2. ENFORCE 2-MEMBER FREE LIMIT ON BACKEND
  const { count: currentMemberCount } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const plan = workspace?.plan || 'free';
  const memberCount = currentMemberCount || 1;

  if (plan === 'free' && memberCount >= 2) {
    return {
      error: 'Free plan limit reached (maximum 2 workspace members). An active Team subscription is required for 3 or more members.',
      requiresUpgrade: true,
    };
  }

  // 3. Check for duplicate membership
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', targetEmail)
    .single();

  if (existingUser) {
    const { data: alreadyMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', existingUser.id)
      .single();

    if (alreadyMember) {
      return { error: 'This user is already a member of this workspace' };
    }
  }

  // 4. Generate secure 32-byte token and expiration (7 days)
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 5. Store invitation in database
  const { error: inviteErr } = await supabase.from('workspace_invitations').insert({
    workspace_id: workspaceId,
    email: targetEmail,
    role,
    token,
    invited_by: user.id,
    status: 'pending',
    expires_at: expiresAt,
  });

  if (inviteErr) {
    return { error: inviteErr.message };
  }

  // 6. Log audit event
  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'invited_member',
    details: { email: targetEmail, role },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${token}`;

  revalidatePath('/workspace/members');
  return { success: true, token, inviteUrl };
}

/**
 * Revoke a pending invitation
 */
export async function revokeWorkspaceInvitation(invitationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_invitations')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', invitationId);

  if (error) return { error: error.message };

  revalidatePath('/workspace/members');
  return { success: true };
}

/**
 * Accept a workspace invitation via secure token
 */
export async function acceptWorkspaceInvitation(token: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Please sign in or create an account to accept this invitation', redirectLogin: true };
  }

  const supabase = await createClient();

  // 1. Fetch invitation
  const { data: invitation, error: invErr } = await supabase
    .from('workspace_invitations')
    .select('*, workspace:workspaces(*)')
    .eq('token', token)
    .single();

  if (invErr || !invitation) {
    return { error: 'Invalid or expired invitation link' };
  }

  if (invitation.status !== 'pending') {
    return { error: `This invitation is already ${invitation.status}` };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('workspace_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { error: 'This invitation has expired' };
  }

  const workspace = invitation.workspace;
  const workspaceId = invitation.workspace_id;

  // 2. BACKEND ENFORCEMENT: Check free 2-member plan limit at moment of acceptance
  const { count: currentMembers } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (workspace?.plan === 'free' && (currentMembers || 0) >= 2) {
    return {
      error: 'This workspace has reached the Free plan limit of 2 members. The owner must upgrade to a Team plan before you can join.',
      requiresUpgrade: true,
    };
  }

  // 3. Add to workspace_members
  const { error: joinErr } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    role: invitation.role || 'member',
    custom_permissions: {},
  });

  if (joinErr && !joinErr.message?.includes('duplicate')) {
    return { error: joinErr.message };
  }

  // 4. Mark invitation as accepted
  await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', invitation.id);

  // 5. Log audit event
  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'accepted_invitation',
    details: { email: user.email, role: invitation.role },
  });

  await setActiveWorkspace(workspaceId);
  return { success: true, workspaceId };
}

/**
 * Update member role (Owner control only)
 */
export async function updateMemberRole(workspaceId: string, memberId: string, newRole: WorkspaceRole) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { isOwner } = await getWorkspaceMembers(workspaceId);
  if (!isOwner) {
    return { error: 'Only the workspace creator can change member roles' };
  }

  // Target member check: Cannot modify owner
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (targetMember?.role === 'owner') {
    return { error: 'The workspace owner cannot be modified or demoted' };
  }

  // Admin cannot promote someone to Owner or grant themselves Owner privileges
  if (!isOwner && newRole === 'owner') {
    return { error: 'Only the current owner can transfer workspace ownership' };
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({
      role: newRole,
      custom_permissions: {}, // Reset custom overrides when role changes
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId);

  if (error) return { error: error.message };

  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'updated_role',
    details: { targetMemberId: memberId, newRole },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

/**
 * Update custom permissions for an individual member (Owner-Controlled Custom Permissions)
 */
export async function updateMemberCustomPermissions(
  workspaceId: string,
  memberId: string,
  permissions: Partial<WorkspacePermissions>
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { isOwner, userPermissions } = await getWorkspaceMembers(workspaceId);

  if (!isOwner && !userPermissions.can_manage_permissions) {
    return { error: 'Only the workspace creator can change teammate permissions' };
  }

  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (targetMember?.role === 'owner') {
    return { error: 'Owner permissions are absolute and cannot be restricted' };
  }

  // Non-owners cannot grant billing control
  if (!isOwner && permissions.can_manage_billing) {
    delete permissions.can_manage_billing;
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({
      custom_permissions: permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId);

  if (error) return { error: error.message };

  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'updated_custom_permissions',
    details: { targetMemberId: memberId, permissions },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

/**
 * Remove a member from the workspace
 */
export async function removeWorkspaceMember(workspaceId: string, memberId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { isOwner, userPermissions } = await getWorkspaceMembers(workspaceId);

  if (!isOwner && !userPermissions.can_remove_members) {
    return { error: 'Only the workspace creator can remove members' };
  }

  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', memberId)
    .single();

  // PROTECTED: Owner cannot be removed
  if (targetMember?.role === 'owner') {
    return { error: 'The workspace owner cannot be removed' };
  }

  const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);

  if (error) return { error: error.message };

  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'removed_member',
    details: { targetMemberId: memberId },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

/**
 * Securely transfer ownership to another member
 */
export async function transferWorkspaceOwnership(workspaceId: string, newOwnerMemberId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();

  if (workspace?.owner_id !== user.id) {
    return { error: 'Only the current workspace owner can transfer ownership' };
  }

  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('id', newOwnerMemberId)
    .single();

  if (!targetMember) {
    return { error: 'Selected member was not found' };
  }

  // 1. Update target member to Owner
  await supabase
    .from('workspace_members')
    .update({ role: 'owner', updated_at: new Date().toISOString() })
    .eq('id', newOwnerMemberId);

  // 2. Demote previous owner to Admin
  await supabase
    .from('workspace_members')
    .update({ role: 'admin', updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id);

  // 3. Update workspace owner_id
  await supabase
    .from('workspaces')
    .update({ owner_id: targetMember.user_id, updated_at: new Date().toISOString() })
    .eq('id', workspaceId);

  await supabase.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'transferred_ownership',
    details: { newOwnerId: targetMember.user_id },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function getWorkspaceAuditLogs(workspaceId: string): Promise<WorkspaceAuditLog[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const db = createAdminClient() || supabase;
  try {
    const { data, error } = await db
      .from('workspace_audit_logs')
      .select('*, actor:profiles(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) return [];
    return (data as any) || [];
  } catch {
    return [];
  }
}

