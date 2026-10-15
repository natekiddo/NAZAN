import { WorkspaceRole, WorkspacePermissions, WorkspaceMember, Workspace } from '@/types';

/**
 * Default role permissions matrix.
 * Owner has full absolute control.
 * Admin has delegated administrative functions (cannot touch billing or transfer ownership).
 * Member has standard collaborative capabilities.
 * Guest has minimal read-focused capabilities.
 */
export function getDefaultRolePermissions(role: WorkspaceRole): WorkspacePermissions {
  switch (role) {
    case 'owner':
      return {
        can_view_workspace: true,
        can_create_projects: true,
        can_edit_projects: true,
        can_delete_projects: true,
        can_view_tasks: true,
        can_create_tasks: true,
        can_edit_tasks: true,
        can_delete_tasks: true,
        can_view_files: true,
        can_upload_files: true,
        can_download_files: true,
        can_delete_files: true,
        can_share_files: true,
        can_manage_notes: true,
        can_send_messages: true,
        can_start_calls: true,
        can_invite_members: true,
        can_remove_members: true,
        can_manage_permissions: true,
        can_view_activity: true,
        can_export_reports: true,
        can_manage_settings: true,
        can_manage_billing: true,
      };

    case 'admin':
      return {
        can_view_workspace: true,
        can_create_projects: true,
        can_edit_projects: true,
        can_delete_projects: false,
        can_view_tasks: true,
        can_create_tasks: true,
        can_edit_tasks: true,
        can_delete_tasks: true,
        can_view_files: true,
        can_upload_files: true,
        can_download_files: true,
        can_delete_files: false,
        can_share_files: true,
        can_manage_notes: true,
        can_send_messages: true,
        can_start_calls: true,
        can_invite_members: false,
        can_remove_members: false,
        can_manage_permissions: false,
        can_view_activity: true,
        can_export_reports: true,
        can_manage_settings: false,
        can_manage_billing: false,
      };

    case 'member':
      return {
        can_view_workspace: true,
        can_create_projects: true,
        can_edit_projects: true,
        can_delete_projects: false,
        can_view_tasks: true,
        can_create_tasks: true,
        can_edit_tasks: true,
        can_delete_tasks: false,
        can_view_files: true,
        can_upload_files: true,
        can_download_files: true,
        can_delete_files: false,
        can_share_files: true,
        can_manage_notes: true,
        can_send_messages: true,
        can_start_calls: true,
        can_invite_members: false,
        can_remove_members: false,
        can_manage_permissions: false,
        can_view_activity: true,
        can_export_reports: false,
        can_manage_settings: false,
        can_manage_billing: false,
      };

    case 'guest':
      return {
        can_view_workspace: true,
        can_create_projects: false,
        can_edit_projects: false,
        can_delete_projects: false,
        can_view_tasks: true,
        can_create_tasks: false,
        can_edit_tasks: false,
        can_delete_tasks: false,
        can_view_files: true,
        can_upload_files: false,
        can_download_files: true,
        can_delete_files: false,
        can_share_files: false,
        can_manage_notes: false,
        can_send_messages: true,
        can_start_calls: false,
        can_invite_members: false,
        can_remove_members: false,
        can_manage_permissions: false,
        can_view_activity: false,
        can_export_reports: false,
        can_manage_settings: false,
        can_manage_billing: false,
      };
  }
}

/**
 * Compute the effective permissions for a member by applying custom overrides on top of role defaults.
 * The Owner always retains all permissions true (cannot be overridden).
 */
export function getEffectivePermissions(
  role: WorkspaceRole,
  customOverrides?: Partial<WorkspacePermissions> | null
): WorkspacePermissions {
  if (role === 'owner') {
    return getDefaultRolePermissions('owner');
  }

  const base = getDefaultRolePermissions(role);
  if (!customOverrides || Object.keys(customOverrides).length === 0) {
    return base;
  }

  const effective = { ...base };
  for (const [key, value] of Object.entries(customOverrides)) {
    if (typeof value === 'boolean') {
      (effective as any)[key] = value;
    }
  }

  // Security constraint: billing remains owner-only unless explicitly allowed
  if (!customOverrides.can_manage_billing) {
    effective.can_manage_billing = false;
  }

  return effective;
}

/**
 * Check if a workspace member has a specific permission.
 */
export function hasPermission(
  member: WorkspaceMember | null | undefined,
  permission: keyof WorkspacePermissions
): boolean {
  if (!member) return false;
  if (member.role === 'owner') return true;
  const effective = getEffectivePermissions(member.role, member.custom_permissions);
  return Boolean(effective[permission]);
}

/**
 * Human-friendly metadata for all workspace permission keys
 */
export const PERMISSION_METADATA: Record<
  keyof WorkspacePermissions,
  { label: string; description: string; category: 'projects' | 'tasks' | 'files' | 'collaboration' | 'admin' }
> = {
  can_view_workspace: {
    label: 'View Workspace & Projects',
    description: 'Allow viewing project lists and workspace dashboards',
    category: 'projects',
  },
  can_create_projects: {
    label: 'Create Projects',
    description: 'Allow starting new project tracks and sprint roadmaps',
    category: 'projects',
  },
  can_edit_projects: {
    label: 'Edit Project Details',
    description: 'Allow modifying project metadata, milestones, and categories',
    category: 'projects',
  },
  can_delete_projects: {
    label: 'Delete or Archive Projects',
    description: 'Allow archiving or permanently removing project workspaces',
    category: 'projects',
  },
  can_view_tasks: {
    label: 'View Tasks',
    description: 'Allow viewing tasks, Kanban boards, and deadlines',
    category: 'tasks',
  },
  can_create_tasks: {
    label: 'Create & Assign Tasks',
    description: 'Allow creating new backlog and sprint tasks',
    category: 'tasks',
  },
  can_edit_tasks: {
    label: 'Edit Tasks',
    description: 'Allow updating task status, estimates, and assignees',
    category: 'tasks',
  },
  can_delete_tasks: {
    label: 'Delete Tasks',
    description: 'Allow removing tasks from the board',
    category: 'tasks',
  },
  can_view_files: {
    label: 'View Files & Cloud Assets',
    description: 'Allow viewing Google Drive and project file references',
    category: 'files',
  },
  can_upload_files: {
    label: 'Upload Files',
    description: 'Allow uploading and auto-syncing files to Google Drive',
    category: 'files',
  },
  can_download_files: {
    label: 'Download Files',
    description: 'Allow downloading or viewing file contents',
    category: 'files',
  },
  can_delete_files: {
    label: 'Delete or Trash Files',
    description: 'Allow deleting or replacing uploaded files',
    category: 'files',
  },
  can_share_files: {
    label: 'Share Files',
    description: 'Allow generating file links for other teammates',
    category: 'files',
  },
  can_manage_notes: {
    label: 'Manage Project Notes',
    description: 'Allow creating, editing, and reading technical project documentation',
    category: 'collaboration',
  },
  can_send_messages: {
    label: 'Send Chat Messages',
    description: 'Allow posting real-time messages in project and team chat',
    category: 'collaboration',
  },
  can_start_calls: {
    label: 'Voice & Video Calls',
    description: 'Allow initiating or joining live audio and video meeting rooms',
    category: 'collaboration',
  },
  can_invite_members: {
    label: 'Invite Teammates',
    description: 'Allow sending email invitations to new workspace collaborators',
    category: 'admin',
  },
  can_remove_members: {
    label: 'Remove Members',
    description: 'Allow removing members (cannot remove workspace owner)',
    category: 'admin',
  },
  can_manage_permissions: {
    label: 'Manage Permissions',
    description: 'Allow granting or modifying custom permissions of other members',
    category: 'admin',
  },
  can_view_activity: {
    label: 'View Audit & Activity Logs',
    description: 'Allow inspecting workspace security events and member activity history',
    category: 'admin',
  },
  can_export_reports: {
    label: 'Export Project Reports',
    description: 'Allow generating and downloading milestone and task reports',
    category: 'admin',
  },
  can_manage_settings: {
    label: 'Manage Workspace Settings',
    description: 'Allow editing workspace name, branding, and integrations',
    category: 'admin',
  },
  can_manage_billing: {
    label: 'Manage Subscription & Billing',
    description: 'Allow upgrading plans and managing payment methods (Owner-only by default)',
    category: 'admin',
  },
};
