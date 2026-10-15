'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email';
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

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const processedCount = {
    notificationsCreated: 0,
    emailsSent: 0,
  };

  const userEmail = user.email;
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Developer';

  // 1. Process explicit reminders scheduled_for <= NOW()
  const { data: dueReminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString());

  for (const rem of dueReminders || []) {
    const idempotencyKey = `rem_${rem.id}_${rem.scheduled_for}`;

    // Check if already delivered
    const { data: existing } = await supabase
      .from('notification_deliveries')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (!existing) {
      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        reminder_id: rem.id,
        title: rem.title,
        message: rem.description || `Reminder scheduled for ${rem.scheduled_for}`,
        type: 'reminder',
        is_read: false,
      } as any);
      processedCount.notificationsCreated++;

      // Send email if user has email
      let emailSuccess = false;
      let emailError: string | undefined = undefined;
      if (userEmail) {
        const mailRes = await sendReminderEmail({
          toEmail: userEmail,
          userName,
          title: rem.title,
          message: rem.description || 'You have a scheduled reminder on ProjectHub.',
          reminderType: rem.reminder_type,
        });
        emailSuccess = mailRes.success;
        emailError = mailRes.error;
        if (emailSuccess) processedCount.emailsSent++;
      }

      // Record delivery with idempotency key
      await supabase.from('notification_deliveries').insert({
        reminder_id: rem.id,
        user_id: user.id,
        channel: 'in_app',
        status: 'sent',
        idempotency_key: idempotencyKey,
      } as any);

      if (userEmail) {
        await supabase.from('notification_deliveries').insert({
          reminder_id: rem.id,
          user_id: user.id,
          channel: 'email',
          status: emailSuccess ? 'sent' : 'failed',
          error_message: emailError || null,
          idempotency_key: `${idempotencyKey}_email`,
        } as any);
      }

      // Mark reminder as sent
      await supabase
        .from('reminders')
        .update({ status: 'sent' } as any)
        .eq('id', rem.id);
    }
  }

  // 2. Scan overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, project_id, project:projects(name)')
    .eq('user_id', user.id)
    .neq('status', 'Completed')
    .lt('due_date', todayStr);

  for (const task of overdueTasks || []) {
    const idempotencyKey = `task_overdue_${task.id}_${todayStr}`;
    const { data: existing } = await supabase
      .from('notification_deliveries')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (!existing) {
      const title = `⚠️ Overdue Task: ${task.title}`;
      const message = `Task was due on ${task.due_date} in ${(task as any).project?.name || 'Project'}.`;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title,
        message,
        type: 'warning',
        is_read: false,
      } as any);
      processedCount.notificationsCreated++;

      if (userEmail) {
        const mailRes = await sendReminderEmail({
          toEmail: userEmail,
          userName,
          title,
          message,
          reminderType: 'task_overdue',
        });
        if (mailRes.success) processedCount.emailsSent++;
      }

      await supabase.from('notification_deliveries').insert({
        user_id: user.id,
        channel: 'in_app',
        status: 'sent',
        idempotency_key: idempotencyKey,
      } as any);
    }
  }

  // 3. Scan tasks due tomorrow
  const { data: tomorrowTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, project:projects(name)')
    .eq('user_id', user.id)
    .neq('status', 'Completed')
    .eq('due_date', tomorrowStr);

  for (const task of tomorrowTasks || []) {
    const idempotencyKey = `task_due_tomorrow_${task.id}_${todayStr}`;
    const { data: existing } = await supabase
      .from('notification_deliveries')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (!existing) {
      const title = `📅 Task Due Tomorrow: ${task.title}`;
      const message = `Due on ${task.due_date}. Don't forget to wrap it up!`;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title,
        message,
        type: 'info',
        is_read: false,
      } as any);
      processedCount.notificationsCreated++;

      if (userEmail) {
        const mailRes = await sendReminderEmail({
          toEmail: userEmail,
          userName,
          title,
          message,
          reminderType: 'task_due',
        });
        if (mailRes.success) processedCount.emailsSent++;
      }

      await supabase.from('notification_deliveries').insert({
        user_id: user.id,
        channel: 'in_app',
        status: 'sent',
        idempotency_key: idempotencyKey,
      } as any);
    }
  }

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { success: true, processedCount };
}
