import 'server-only';
import { sendReminderEmail } from '@/lib/email';

type ReminderProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  email_notifications: boolean | null;
  in_app_notifications: boolean | null;
};

type ReminderEvent = {
  key: string;
  title: string;
  message: string;
  type: string;
  reminderId?: string | null;
};

type ProcessTotals = { notificationsCreated: number; emailsSent: number; failures: number };

async function hasSent(client: any, key: string) {
  const { data } = await client
    .from('notification_deliveries')
    .select('id,status')
    .eq('idempotency_key', key)
    .maybeSingle();
  return data?.status === 'sent';
}

async function saveDelivery(client: any, input: {
  reminderId?: string | null;
  profile: ReminderProfile;
  channel: 'in_app' | 'email';
  status: 'sent' | 'failed';
  key: string;
  error?: string | null;
}) {
  return client.from('notification_deliveries').upsert({
    reminder_id: input.reminderId || null,
    user_id: input.profile.id,
    channel: input.channel,
    status: input.status,
    error_message: input.error || null,
    sent_at: new Date().toISOString(),
    idempotency_key: input.key,
  }, { onConflict: 'idempotency_key' });
}

async function deliverEvent(client: any, profile: ReminderProfile, event: ReminderEvent, totals: ProcessTotals) {
  const wantsInApp = profile.in_app_notifications !== false;
  const wantsEmail = profile.email_notifications !== false && Boolean(profile.email);
  let complete = true;

  if (wantsInApp) {
    const key = event.key;
    if (!(await hasSent(client, key))) {
      const { error: notificationError } = await client.from('notifications').insert({
        user_id: profile.id,
        reminder_id: event.reminderId || null,
        title: event.title,
        message: event.message,
        type: event.type,
        is_read: false,
      });
      if (notificationError) {
        complete = false;
        totals.failures++;
        await saveDelivery(client, { profile, reminderId: event.reminderId, channel: 'in_app', status: 'failed', key, error: notificationError.message });
      } else {
        await saveDelivery(client, { profile, reminderId: event.reminderId, channel: 'in_app', status: 'sent', key });
        totals.notificationsCreated++;
      }
    }
  }

  if (wantsEmail) {
    const key = `${event.key}_email`;
    if (!(await hasSent(client, key))) {
      const result = await sendReminderEmail({
        toEmail: profile.email!,
        userName: profile.full_name || profile.email!.split('@')[0] || 'ProjectHub member',
        title: event.title,
        message: event.message,
        reminderType: event.type,
      });
      await saveDelivery(client, {
        profile,
        reminderId: event.reminderId,
        channel: 'email',
        status: result.success ? 'sent' : 'failed',
        key,
        error: result.error,
      });
      if (result.success) totals.emailsSent++;
      else { complete = false; totals.failures++; }
    }
  }

  return complete;
}

export async function processReminderEventsForUser(client: any, profile: ReminderProfile, now = new Date()) {
  const totals: ProcessTotals = { notificationsCreated: 0, emailsSent: 0, failures: 0 };
  const today = now.toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const { data: reminders } = await client
    .from('reminders')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString());

  for (const reminder of reminders || []) {
    const complete = await deliverEvent(client, profile, {
      key: `rem_${reminder.id}_${reminder.scheduled_for}`,
      reminderId: reminder.id,
      title: reminder.title,
      message: reminder.description || `Reminder scheduled for ${reminder.scheduled_for}`,
      type: reminder.reminder_type,
    }, totals);
    if (complete) {
      await client.from('reminders').update({ status: 'sent' }).eq('id', reminder.id).eq('user_id', profile.id);
    }
  }

  const { data: overdueTasks } = await client
    .from('tasks')
    .select('id,title,due_date,project:projects(name)')
    .eq('user_id', profile.id)
    .neq('status', 'Completed')
    .lt('due_date', today);

  for (const task of overdueTasks || []) {
    await deliverEvent(client, profile, {
      key: `task_overdue_${task.id}_${today}`,
      title: `Overdue task: ${task.title}`,
      message: `This task was due on ${task.due_date} in ${task.project?.name || 'your project'}.`,
      type: 'task_overdue',
    }, totals);
  }

  const { data: tomorrowTasks } = await client
    .from('tasks')
    .select('id,title,due_date,project:projects(name)')
    .eq('user_id', profile.id)
    .neq('status', 'Completed')
    .eq('due_date', tomorrow);

  for (const task of tomorrowTasks || []) {
    await deliverEvent(client, profile, {
      key: `task_due_tomorrow_${task.id}_${today}`,
      title: `Task due tomorrow: ${task.title}`,
      message: `Due on ${task.due_date}. Add it to your plan before the day begins.`,
      type: 'task_due',
    }, totals);
  }

  return totals;
}