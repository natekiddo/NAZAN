'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Bell, Check, Loader2, Mail } from 'lucide-react';
import { updateNotificationPreferences } from '@/lib/actions/settings';

export default function NotificationPreferencesForm({
  initialEmail,
  initialInApp,
}: {
  initialEmail: boolean;
  initialInApp: boolean;
}) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmail);
  const [inAppEnabled, setInAppEnabled] = useState(initialInApp);
  const [saving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        emailNotifications: emailEnabled,
        inAppNotifications: inAppEnabled,
      });
      setFeedback(result.error || 'Notification preferences saved.');
    });
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Notification channels</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose where ProjectHub should send scheduled reminders.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
        <input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-black dark:accent-white" />
        <span><span className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white"><Mail className="h-3.5 w-3.5" />Email reminders</span><span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Task due dates, overdue work, and scheduled reminders.</span></span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
        <input type="checkbox" checked={inAppEnabled} onChange={(event) => setInAppEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-black dark:accent-white" />
        <span><span className="text-xs font-semibold text-slate-900 dark:text-white">In-app notifications</span><span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Alerts in your ProjectHub notification center.</span></span>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p aria-live="polite" className={`text-xs ${feedback?.startsWith('Notification') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{feedback}</p>
        <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-slate-200">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : feedback && !feedback.startsWith('Notification') ? null : feedback ? <Check className="h-3.5 w-3.5" /> : null}
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </form>
  );
}