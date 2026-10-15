import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { NotificationItem } from '@/types';
import NotificationsView from '@/components/notifications/NotificationsView';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let notifications: NotificationItem[] = [];

  if (user) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    notifications = (data as unknown as NotificationItem[]) || [];
  }

  return <NotificationsView notifications={notifications} />;
}
