import React from 'react';
import { createClient } from '@/lib/supabase/server';
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
    const [projRes, tasksRes, mileRes, remRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Archived')
        .order('name', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Completed')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true }),
      supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true }),
      supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('scheduled_for', { ascending: true }),
    ]);

    projects = (projRes.data as unknown as Project[]) || [];
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
