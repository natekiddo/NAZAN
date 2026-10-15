'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  RotateCw,
  Loader2,
  Mail,
} from 'lucide-react';
import { NotificationItem } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  processDueReminders,
} from '@/lib/actions/reminders';
import { useRouter } from 'next/navigation';

interface NotificationsViewProps {
  notifications: NotificationItem[];
}

export default function NotificationsView({ notifications }: NotificationsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'reminder'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'warning') return n.type === 'warning';
    if (filter === 'reminder') return n.type === 'reminder';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleTriggerProcess = async () => {
    setIsProcessing(true);
    setProcessResult(null);

    const res = await processDueReminders();
    setIsProcessing(false);

    if (res.error) {
      setProcessResult(`Error: ${res.error}`);
    } else if (res.processedCount) {
      setProcessResult(
        `Scanned successfully: Created ${res.processedCount.notificationsCreated} in-app notification(s) and dispatched ${res.processedCount.emailsSent} email(s).`
      );
    }
    router.refresh();
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    router.refresh();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-500" />
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deadlines, overdue alerts, and scheduled reminder deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerProcess}
            disabled={isProcessing}
            title="Scan upcoming tasks, overdue items, and trigger reminders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
            )}
            Check Due Reminders
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {processResult && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-in fade-in">
          <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{processResult}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        {(
          [
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            {
              id: 'warning',
              label: `Alerts (${notifications.filter((n) => n.type === 'warning').length})`,
            },
            {
              id: 'reminder',
              label: `Reminders (${notifications.filter((n) => n.type === 'reminder').length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            All caught up!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No notifications match your current filter. You will receive alerts when task deadlines or project milestones are approaching.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs ${
                item.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-indigo-50/40 dark:bg-slate-800/80 border-indigo-200/80 dark:border-indigo-800 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!item.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete notification"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
