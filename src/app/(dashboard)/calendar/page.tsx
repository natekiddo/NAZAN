import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/actions/projects';
import { Project, Task, Milestone, Reminder } from '@/types';
import CalendarView from '@/components/calendar/CalendarView';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let projects: Project[] = [];
  let tasks: Task[] = [];
  let milestones: Milestone[] = [];
  let reminders: Reminder[] = [];

  if (user) {
    const { projects: projList } = await getProjects();
    projects = (projList || []).filter((p) => p.status !== 'Archived');
    const projectIds = projects.map((p) => p.id);

    let tasksQuery = supabase
      .from('tasks')
      .select('*')
      .neq('status', 'Completed')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    let mileQuery = supabase
      .from('milestones')
      .select('*')
      .eq('completed', false)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    if (projectIds.length > 0) {
      tasksQuery = tasksQuery.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')})`);
      mileQuery = mileQuery.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')})`);
    } else {
      tasksQuery = tasksQuery.eq('user_id', user.id);
      mileQuery = mileQuery.eq('user_id', user.id);
    }

    const [tasksRes, mileRes, remRes] = await Promise.all([
      tasksQuery,
      mileQuery,
      supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('scheduled_for', { ascending: true }),
    ]);

    tasks = (tasksRes.data as unknown as Task[]) || [];
    milestones = (mileRes.data as unknown as Milestone[]) || [];
    reminders = (remRes.data as unknown as Reminder[]) || [];
  }

  return (
    <CalendarView
      projects={projects}
      tasks={tasks}
      milestones={milestones}
      reminders={reminders}
    />
  );
}
