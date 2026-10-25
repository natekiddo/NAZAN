'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@/lib/supabase/server';
import { generateAIWorkSummary, askAIAssistantWithContext, WorkspaceContext } from '@/lib/gemini';
import { Project, Task, WorkSession, ProjectNote } from '@/types';

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
  chatHistory?: Array<{ role: 'user' | 'model'; content: string }>
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
    const [projRes, tasksRes, notesRes, sessionsRes] = await Promise.all([
      supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('tasks')
        .select('title, status, priority')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .limit(10),
      supabase
        .from('project_notes')
        .select('title, content')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .limit(5),
      supabase
        .from('work_sessions')
        .select('title, work_completed, next_action')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5),
    ]);

    if (projRes.data) {
      projectContext = {
        projectName: projRes.data.name,
        projectDescription: projRes.data.description || undefined,
        tasks: tasksRes.data || [],
        notes: (notesRes.data || []).map((n) => ({ title: n.title, content: n.content?.slice(0, 300) })),
        sessions: (sessionsRes.data || []).map((s) => ({
          title: s.title,
          work_completed: s.work_completed || undefined,
          next_action: s.next_action || undefined,
        })),
      };
    }
  }

  const answer = await askAIAssistantWithContext(query, projectContext, chatHistory);
  return { answer };
}
