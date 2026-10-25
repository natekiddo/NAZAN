'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateNotificationPreferences(input: {
  emailNotifications: boolean;
  inAppNotifications: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in to update notification preferences.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      email_notifications: input.emailNotifications,
      in_app_notifications: input.inAppNotifications,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: true };
}