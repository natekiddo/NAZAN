import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { WorkSession, Project } from '@/types';
import SessionJournalView from '@/components/sessions/SessionJournalView';

export default async function WorkSessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let sessions: (WorkSession & {
    project?: { name: string } | null;
    task?: { title: string } | null;
  })[] = [];
  let projects: Project[] = [];

  if (user) {
    const [sessionsRes, projectsRes] = await Promise.all([
      supabase
        .from('work_sessions')
        .select('*, project:projects(name), task:tasks(title)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false }),
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Archived')
        .order('name'),
    ]);

    sessions = (sessionsRes.data as unknown as (WorkSession & {
      project?: { name: string } | null;
      task?: { title: string } | null;
    })[]) || [];

    projects = (projectsRes.data as unknown as Project[]) || [];
  }

  return <SessionJournalView initialSessions={sessions} projects={projects} />;
}
