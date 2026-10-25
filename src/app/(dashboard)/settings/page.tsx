import React from 'react';
import { Settings, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Profile, ConnectedDevice } from '@/types';
import ConnectedDevicesView from '@/components/sync/ConnectedDevicesView';
import NotificationPreferencesForm from '@/components/settings/NotificationPreferencesForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let devices: ConnectedDevice[] = [];

  if (user) {
    const [profRes, devRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('connected_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    profile = (profRes.data as unknown as Profile) || null;
    devices = (devRes.data as unknown as ConnectedDevice[]) || [];
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          Settings &amp; Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage profile details, notification channels, and desktop file sync clients.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Profile Information
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                disabled
                defaultValue={user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <NotificationPreferencesForm
          initialEmail={profile?.email_notifications ?? true}
          initialInApp={profile?.in_app_notifications ?? true}
        />
        {/* Desktop Synchronization Clients */}
        <ConnectedDevicesView devices={devices} />
      </div>
    </div>
  );
}
