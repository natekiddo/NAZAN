import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SyncChangeItem {
  action: 'upload' | 'delete' | 'check';
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  projectId?: string;
  fileId?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, changes } = body as {
      deviceId: string;
      changes: SyncChangeItem[];
    };

    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json({ error: 'Invalid changes array' }, { status: 400 });
    }

    // Verify device exists and belongs to user
    const { data: device } = await supabase
      .from('connected_devices')
      .select('id, status')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (!device) {
      return NextResponse.json({ error: 'Device not registered or revoked' }, { status: 403 });
    }

    if (device.status === 'paused') {
      return NextResponse.json({ error: 'Device sync is currently paused' }, { status: 403 });
    }

    const plan: Array<{
      action: 'upload' | 'download' | 'delete' | 'skip';
      fileName: string;
      uploadUrl?: string;
      downloadUrl?: string;
      storagePath?: string;
    }> = [];

    let processedCount = 0;

    for (const item of changes) {
      if (item.action === 'upload') {
        const fileId = crypto.randomUUID();
        const sanitized = item.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user.id}/${fileId}/${sanitized}`;

        // Create signed upload URL
        const { data: uploadData } = await supabase.storage
          .from('project-files')
          .createSignedUploadUrl(storagePath);

        plan.push({
          action: 'upload',
          fileName: item.fileName,
          uploadUrl: uploadData?.signedUrl,
          storagePath,
        });
        processedCount++;
      } else if (item.action === 'delete' && item.fileId) {
        // Delete file from db and storage
        const { data: file } = await supabase
          .from('files')
          .select('storage_path')
          .eq('id', item.fileId)
          .eq('user_id', user.id)
          .single();

        if (file) {
          await supabase.storage.from('project-files').remove([file.storage_path]);
          await supabase.from('files').delete().eq('id', item.fileId).eq('user_id', user.id);
        }

        plan.push({ action: 'delete', fileName: item.fileName });
        processedCount++;
      }
    }

    // Record sync job and update last_synced_at
    await supabase.from('sync_jobs').insert({
      user_id: user.id,
      device_id: device.id,
      status: 'completed',
      files_processed: processedCount,
      total_files: changes.length,
      logs: [{ message: `Processed ${processedCount} file change(s)`, timestamp: new Date().toISOString() }],
      completed_at: new Date().toISOString(),
    } as any);

    await supabase
      .from('connected_devices')
      .update({ last_synced_at: new Date().toISOString() } as any)
      .eq('id', device.id);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process sync batch' }, { status: 500 });
  }
}
