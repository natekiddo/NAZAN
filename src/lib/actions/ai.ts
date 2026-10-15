'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@/lib/supabase/server';
import {
  generateAIWorkSummary,
  askAIAssistantWithContext,
  generateProjectMemoryBriefing,
  analyzeFileContent,
  WorkspaceContext,
} from '@/lib/gemini';
import { Project, Task, WorkSession, ProjectNote, FileAnalysisMode } from '@/types';
import { getUserDriveAccessToken } from '@/lib/actions/drive';
import { fetchDriveFileContent } from '@/lib/google-drive';

export async function getAIWorkSummaryAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Developer';

  // 1. Fetch user's active projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('name, category, status, priority, progress, deadline, next_action')
    .eq('user_id', user.id)
    .neq('status', 'Archived')
    .order('updated_at', { ascending: false });

  // 2. Fetch recent work sessions (last 10)
  const { data: sessionsData } = await supabase
    .from('work_sessions')
    .select('title, duration_mins, work_completed, next_action, blockers, start_time, project:projects(name)')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(10);

  // 3. Fetch active tasks
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('title, status, priority, due_date, project:projects(name)')
    .eq('user_id', user.id)
    .neq('status', 'Completed')
    .order('due_date', { ascending: true })
    .limit(15);

  const context: WorkspaceContext = {
    userName,
    projects: (projectsData as any) || [],
    recentSessions: ((sessionsData as any) || []).map((s: any) => ({
      title: s.title,
      duration_mins: s.duration_mins,
      work_completed: s.work_completed,
      next_action: s.next_action,
      blockers: s.blockers,
      start_time: s.start_time,
      project_name: s.project?.name,
    })),
    tasks: ((tasksData as any) || []).map((t: any) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project_name: t.project?.name,
    })),
  };

  const summary = await generateAIWorkSummary(context);
  return { summary };
}

export async function askAIAssistantAction(
  query: string,
  projectId?: string | null,
  chatHistory?: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  let projectContext: {
    projectName?: string;
    projectDescription?: string;
    tasks?: Array<{ title: string; status: string; priority: string }>;
    notes?: Array<{ title: string; content?: string }>;
    sessions?: Array<{ title: string; work_completed?: string; next_action?: string }>;
  } | undefined = undefined;

  if (projectId) {
    // Check project access (creator or workspace member)
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, user_id, workspace_id')
      .eq('id', projectId)
      .single();

    if (project) {
      let hasAccess = project.user_id === user.id;
      if (!hasAccess && project.workspace_id) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', project.workspace_id)
          .eq('user_id', user.id)
          .single();
        if (member) hasAccess = true;
      }

      if (hasAccess) {
        const [tasksRes, notesRes, sessionsRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('title, status, priority')
            .eq('project_id', projectId)
            .limit(15),
          supabase
            .from('project_notes')
            .select('title, content')
            .eq('project_id', projectId)
            .limit(5),
          supabase
            .from('work_sessions')
            .select('title, work_completed, next_action')
            .eq('project_id', projectId)
            .order('start_time', { ascending: false })
            .limit(5),
        ]);

        projectContext = {
          projectName: project.name,
          projectDescription: project.description || undefined,
          tasks: tasksRes.data || [],
          notes: (notesRes.data || []).map((n: any) => ({ title: n.title, content: n.content?.slice(0, 300) })),
          sessions: (sessionsRes.data || []).map((s: any) => ({
            title: s.title,
            work_completed: s.work_completed || undefined,
            next_action: s.next_action || undefined,
          })),
        };
      }
    }
  }

  const answer = await askAIAssistantWithContext(query, projectContext, chatHistory);
  return { answer };
}

export async function getProjectAIMemoryAction(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // 1. Fetch project with authorization check
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) {
    return { error: 'Project not found' };
  }

  let hasAccess = project.user_id === user.id;
  if (!hasAccess && project.workspace_id) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .single();
    if (member) hasAccess = true;
  }

  if (!hasAccess) {
    return { error: 'Access denied: You do not have permission to view this project' };
  }

  // 2. Fetch latest work session (most recent stopping point)
  const { data: sessions } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('start_time', { ascending: false })
    .limit(1);

  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null;

  // 3. Fetch active tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, status, priority, due_date')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 4. Fetch recent notes
  const { data: notes } = await supabase
    .from('project_notes')
    .select('title, content')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(5);

  // 5. Fetch recent activity
  const { data: activity } = await supabase
    .from('activity_logs')
    .select('action, details, created_at')
    .eq('details->>project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(8);

  const briefing = await generateProjectMemoryBriefing({
    projectName: project.name,
    projectDescription: project.description || undefined,
    lastSession: lastSession
      ? {
          title: lastSession.title,
          work_completed: lastSession.work_completed,
          next_action: lastSession.next_action,
          blockers: lastSession.blockers,
          start_time: lastSession.start_time,
          duration_mins: lastSession.duration_mins,
        }
      : null,
    tasks: tasks || [],
    recentNotes: (notes || []).map((n: any) => ({ title: n.title, content: n.content })),
    recentActivity: (activity || []).map((a: any) => ({
      action: a.action,
      details: a.details,
      created_at: a.created_at,
    })),
  });

  return {
    success: true,
    projectName: project.name,
    lastSession,
    unfinishedCount: (tasks || []).filter((t: any) => t.status !== 'Completed').length,
    briefing,
  };
}

export async function analyzeFileWithGeminiAction(
  fileId: string,
  mode: FileAnalysisMode = 'explain',
  customPrompt?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // 1. Fetch file record
  const { data: file, error: fileErr } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (fileErr || !file) {
    return { error: 'File not found' };
  }

  // 2. Fetch content
  let content = '';

  if (file.source === 'google_drive' && file.external_drive_file_id) {
    const token = await getUserDriveAccessToken();
    if (token) {
      const driveContentRes = await fetchDriveFileContent(token, file.external_drive_file_id);
      if (driveContentRes.success && driveContentRes.content) {
        content = driveContentRes.content;
      }
    }
  }

  // Fallback: download from Supabase storage if not Google Drive or if Drive content empty
  if (!content && file.storage_path && !file.storage_path.startsWith('http')) {
    try {
      const { data: blob } = await supabase.storage
        .from('project-files')
        .download(file.storage_path);

      if (blob) {
        content = await blob.text();
      }
    } catch (e) {
      console.warn('Storage file read error:', e);
    }
  }

  if (!content) {
    content = `[File: ${file.original_name}, Type: ${file.mime_type}, Size: ${file.file_size} bytes]`;
  }

  const analysis = await analyzeFileContent(
    file.original_name,
    file.mime_type,
    content,
    mode,
    customPrompt
  );

  return {
    success: true,
    fileId: file.id,
    fileName: file.original_name,
    mode,
    analysis,
  };
}

