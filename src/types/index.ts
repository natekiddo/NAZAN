import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type WorkSession = Database['public']['Tables']['work_sessions']['Row'];
export type ProjectNote = Database['public']['Tables']['project_notes']['Row'];
export type Folder = Database['public']['Tables']['folders']['Row'];
export type FileItem = Database['public']['Tables']['files']['Row'];
export type FileVersion = Database['public']['Tables']['file_versions']['Row'];
export type Reminder = Database['public']['Tables']['reminders']['Row'];
export type NotificationItem = Database['public']['Tables']['notifications']['Row'];
export type Integration = Database['public']['Tables']['integrations']['Row'];
export type ConnectedDevice = Database['public']['Tables']['connected_devices']['Row'];

export type ProjectStatus = Project['status'];
export type ProjectPriority = Project['priority'];
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export interface ProjectWithStats extends Project {
  taskCount?: number;
  completedTaskCount?: number;
  recentSession?: WorkSession | null;
}

export interface TaskWithProject extends Task {
  project?: Project | null;
  milestone?: Milestone | null;
}

export interface WorkSessionWithProject extends WorkSession {
  project?: Project | null;
  task?: Task | null;
}

export interface DashboardOverview {
  userProfile: Profile | null;
  activeProjects: ProjectWithStats[];
  totalTasksCount: number;
  completedTasksCount: number;
  todayTasksCount: number;
  overdueTasksCount: number;
  upcomingDeadlines: (TaskWithProject | Project)[];
  recentWorkSessions: WorkSessionWithProject[];
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    details: Record<string, unknown>;
  }>;
  continueStoppingPoints: Array<{
    project: Project;
    latestSession: WorkSession | null;
  }>;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';
export type WorkspacePlan = 'free' | 'team' | 'pro' | 'enterprise';

export interface WorkspacePermissions {
  // Projects
  can_view_workspace: boolean;
  can_create_projects: boolean;
  can_edit_projects: boolean;
  can_delete_projects: boolean;

  // Tasks
  can_view_tasks: boolean;
  can_create_tasks: boolean;
  can_edit_tasks: boolean;
  can_delete_tasks: boolean;

  // Files & Cloud Storage
  can_view_files: boolean;
  can_upload_files: boolean;
  can_download_files: boolean;
  can_delete_files: boolean;
  can_share_files: boolean;

  // Team & Collaboration
  can_manage_notes: boolean;
  can_send_messages: boolean;
  can_start_calls: boolean;

  // Administration
  can_invite_members: boolean;
  can_remove_members: boolean;
  can_manage_permissions: boolean;
  can_view_activity: boolean;
  can_export_reports: boolean;
  can_manage_settings: boolean;
  can_manage_billing: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string | null;
  owner_id: string;
  plan: WorkspacePlan;
  max_free_members: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  custom_permissions?: Partial<WorkspacePermissions>;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  inviter?: Profile | null;
}

export interface WorkspaceAuditLog {
  id: string;
  workspace_id: string;
  actor_id: string;
  action: string;
  target_user_id?: string | null;
  details?: Record<string, unknown>;
  created_at: string;
  actor?: Profile | null;
}

export interface ChatMessageItem {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  user_id: string;
  content: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  project?: { name: string } | null;
}

export interface CallSessionItem {
  id: string;
  workspace_id: string;
  project_id?: string | null;
  host_user_id: string;
  title: string;
  status: 'active' | 'ended';
  participants: Array<{ user_id: string; name: string; avatar?: string; joined_at: string }>;
  created_at: string;
  ended_at?: string | null;
  host?: Profile | null;
  project?: { name: string } | null;
}

export type FileAnalysisMode = 'explain' | 'summarize' | 'bugs' | 'tasks';

export interface FileAnalysisResult {
  fileId: string;
  fileName: string;
  mode: FileAnalysisMode;
  analysis: string;
  created_at: string;
}

