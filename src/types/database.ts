export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          theme: 'light' | 'dark' | 'system'
          time_zone: string
          email_notifications: boolean
          in_app_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          time_zone?: string
          email_notifications?: boolean
          in_app_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          time_zone?: string
          email_notifications?: boolean
          in_app_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived'
          priority: 'Low' | 'Medium' | 'High' | 'Urgent'
          category: string | null
          start_date: string | null
          deadline: string | null
          progress: number
          technologies: string[]
          repo_url: string | null
          live_url: string | null
          documentation: string | null
          notes: string | null
          last_worked_at: string | null
          next_action: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          category?: string | null
          start_date?: string | null
          deadline?: string | null
          progress?: number
          technologies?: string[]
          repo_url?: string | null
          live_url?: string | null
          documentation?: string | null
          notes?: string | null
          last_worked_at?: string | null
          next_action?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'Planning' | 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          category?: string | null
          start_date?: string | null
          deadline?: string | null
          progress?: number
          technologies?: string[]
          repo_url?: string | null
          live_url?: string | null
          documentation?: string | null
          notes?: string | null
          last_worked_at?: string | null
          next_action?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          milestone_id: string | null
          title: string
          description: string | null
          status: 'Backlog' | 'To Do' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
          priority: 'Low' | 'Medium' | 'High' | 'Urgent'
          start_date: string | null
          due_date: string | null
          estimated_duration_mins: number | null
          actual_duration_mins: number | null
          tags: string[]
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          milestone_id?: string | null
          title: string
          description?: string | null
          status?: 'Backlog' | 'To Do' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          start_date?: string | null
          due_date?: string | null
          estimated_duration_mins?: number | null
          actual_duration_mins?: number | null
          tags?: string[]
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          milestone_id?: string | null
          title?: string
          description?: string | null
          status?: 'Backlog' | 'To Do' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          start_date?: string | null
          due_date?: string | null
          estimated_duration_mins?: number | null
          actual_duration_mins?: number | null
          tags?: string[]
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_sessions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          task_id: string | null
          title: string
          start_time: string
          end_time: string | null
          duration_mins: number
          work_completed: string | null
          files_worked_on: string[]
          problems_encountered: string | null
          decisions_made: string | null
          blockers: string | null
          next_action: string | null
          personal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          task_id?: string | null
          title: string
          start_time?: string
          end_time?: string | null
          duration_mins?: number
          work_completed?: string | null
          files_worked_on?: string[]
          problems_encountered?: string | null
          decisions_made?: string | null
          blockers?: string | null
          next_action?: string | null
          personal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          task_id?: string | null
          title?: string
          start_time?: string
          end_time?: string | null
          duration_mins?: number
          work_completed?: string | null
          files_worked_on?: string[]
          problems_encountered?: string | null
          decisions_made?: string | null
          blockers?: string | null
          next_action?: string | null
          personal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_notes: {
        Row: {
          id: string
          user_id: string
          project_id: string
          title: string
          content: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          title: string
          content: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          title?: string
          content?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          parent_id: string | null
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          parent_id?: string | null
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          parent_id?: string | null
          name?: string
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          task_id: string | null
          folder_id: string | null
          original_name: string
          storage_path: string
          mime_type: string
          file_size: number
          checksum: string | null
          source: 'upload' | 'google_drive' | 'sync'
          external_drive_file_id: string | null
          is_trashed: boolean
          trashed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          task_id?: string | null
          folder_id?: string | null
          original_name: string
          storage_path: string
          mime_type: string
          file_size: number
          checksum?: string | null
          source?: 'upload' | 'google_drive' | 'sync'
          external_drive_file_id?: string | null
          is_trashed?: boolean
          trashed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          task_id?: string | null
          folder_id?: string | null
          original_name?: string
          storage_path?: string
          mime_type?: string
          file_size?: number
          checksum?: string | null
          source?: 'upload' | 'google_drive' | 'sync'
          external_drive_file_id?: string | null
          is_trashed?: boolean
          trashed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      file_versions: {
        Row: {
          id: string
          file_id: string
          user_id: string
          version_number: number
          storage_path: string
          file_size: number
          checksum: string | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          user_id: string
          version_number: number
          storage_path: string
          file_size: number
          checksum?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          user_id?: string
          version_number?: number
          storage_path?: string
          file_size?: number
          checksum?: string | null
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          reminder_type: 'task_due' | 'task_overdue' | 'project_deadline' | 'work_session' | 'personal'
          related_entity_type: string | null
          related_entity_id: string | null
          scheduled_for: string
          is_recurring: boolean
          recurrence_rule: string | null
          status: 'pending' | 'sent' | 'cancelled' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          reminder_type: 'task_due' | 'task_overdue' | 'project_deadline' | 'work_session' | 'personal'
          related_entity_type?: string | null
          related_entity_id?: string | null
          scheduled_for: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          status?: 'pending' | 'sent' | 'cancelled' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          reminder_type?: 'task_due' | 'task_overdue' | 'project_deadline' | 'work_session' | 'personal'
          related_entity_type?: string | null
          related_entity_id?: string | null
          scheduled_for?: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          status?: 'pending' | 'sent' | 'cancelled' | 'failed'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          reminder_id: string | null
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'reminder'
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reminder_id?: string | null
          title: string
          message: string
          type?: 'info' | 'warning' | 'success' | 'reminder'
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reminder_id?: string | null
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'reminder'
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      notification_deliveries: {
        Row: {
          id: string
          reminder_id: string | null
          user_id: string
          channel: 'in_app' | 'email'
          status: 'sent' | 'failed'
          sent_at: string
          error_message: string | null
          idempotency_key: string
        }
        Insert: {
          id?: string
          reminder_id?: string | null
          user_id: string
          channel: 'in_app' | 'email'
          status: 'sent' | 'failed'
          sent_at?: string
          error_message?: string | null
          idempotency_key: string
        }
        Update: {
          id?: string
          reminder_id?: string | null
          user_id?: string
          channel?: 'in_app' | 'email'
          status?: 'sent' | 'failed'
          sent_at?: string
          error_message?: string | null
          idempotency_key?: string
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: 'google_drive'
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          scope: string | null
          status: 'active' | 'expired' | 'revoked'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: 'google_drive'
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          status?: 'active' | 'expired' | 'revoked'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: 'google_drive'
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          status?: 'active' | 'expired' | 'revoked'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      connected_devices: {
        Row: {
          id: string
          user_id: string
          device_name: string
          device_type: string
          sync_folder_path: string | null
          status: 'active' | 'paused' | 'revoked'
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_name: string
          device_type?: string
          sync_folder_path?: string | null
          status?: 'active' | 'paused' | 'revoked'
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_name?: string
          device_type?: string
          sync_folder_path?: string | null
          status?: 'active' | 'paused' | 'revoked'
          last_synced_at?: string | null
          created_at?: string
        }
      }
      sync_jobs: {
        Row: {
          id: string
          user_id: string
          device_id: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          files_processed: number
          total_files: number
          logs: Json
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          files_processed?: number
          total_files?: number
          logs?: Json
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          files_processed?: number
          total_files?: number
          logs?: Json
          created_at?: string
          completed_at?: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
      }
    }
  }
}
