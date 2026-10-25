'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processReminderEventsForUser } from '@/lib/reminders/processor';
import { Reminder, NotificationItem } from '@/types';

export interface CreateReminderInput {
  title: string;
  description?: string | null;
  reminder_type: 'task_due' | 'task_overdue' | 'project_deadline' | 'work_session' | 'personal';
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  scheduled_for: string;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
}

export async function createReminder(input: CreateReminderInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      reminder_type: input.reminder_type,
      related_entity_type: input.related_entity_type || null,
      related_entity_id: input.related_entity_id || null,
      scheduled_for: input.scheduled_for,
      is_recurring: input.is_recurring || false,
      recurrence_rule: input.recurrence_rule || null,
      status: 'pending',
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/calendar');
  revalidatePath('/notifications');
  return { reminder: data as Reminder };
}

export async function deleteReminder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/calendar');
  return { success: true };
}

export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() } as any)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/notifications');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() } as any)
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/notifications');
  return { success: true };
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/notifications');
  return { success: true };
}

/**
 * Server-side processor for scheduled reminders & deadline alerts.
 * Features idempotency and duplicate prevention.
 */
export async function processDueReminders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,email,full_name,email_notifications,in_app_notifications')
    .eq('id', user.id)
    .maybeSingle();

  const totals = await processReminderEventsForUser(supabase, {
    id: user.id,
    email: profile?.email || user.email || null,
    full_name: profile?.full_name || user.user_metadata?.full_name || null,
    email_notifications: profile?.email_notifications ?? true,
    in_app_notifications: profile?.in_app_notifications ?? true,
  });

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: true, processedCount: totals };
}

export async function processDueRemindersForAllUsers() {
  const admin = createAdminClient();
  if (!admin) return { error: 'Reminder processing requires the Supabase service-role key.' };

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id,email,full_name,email_notifications,in_app_notifications');
  if (error) return { error: error.message };

  const processedCount = { notificationsCreated: 0, emailsSent: 0, failures: 0 };
  for (const profile of profiles || []) {
    const totals = await processReminderEventsForUser(admin, {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      email_notifications: profile.email_notifications,
      in_app_notifications: profile.in_app_notifications,
    });
    processedCount.notificationsCreated += totals.notificationsCreated;
    processedCount.emailsSent += totals.emailsSent;
    processedCount.failures += totals.failures;
  }

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: true, processedCount };
}