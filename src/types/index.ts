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
