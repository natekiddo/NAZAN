'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ConnectedDevice } from '@/types';

export interface RegisterDeviceInput {
  device_name: string;
  device_type?: string;
  sync_folder_path?: string;
}

export async function registerDevice(input: RegisterDeviceInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('connected_devices')
    .insert({
      user_id: user.id,
      device_name: input.device_name.trim(),
      device_type: input.device_type || 'desktop',
      sync_folder_path: input.sync_folder_path?.trim() || null,
      status: 'active',
      last_synced_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create initial sync job record
  await supabase.from('sync_jobs').insert({
    user_id: user.id,
    device_id: data.id,
    status: 'completed',
    files_processed: 0,
    total_files: 0,
    logs: [{ message: 'Device registered and sync channel established', timestamp: new Date().toISOString() }],
    completed_at: new Date().toISOString(),
  } as any);

  revalidatePath('/settings');
  return { device: data as ConnectedDevice };
}

export async function revokeDevice(deviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('connected_devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function pauseResumeDevice(deviceId: string, currentStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const nextStatus = currentStatus === 'active' ? 'paused' : 'active';

  const { error } = await supabase
    .from('connected_devices')
    .update({ status: nextStatus } as any)
    .eq('id', deviceId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true, status: nextStatus };
}
