'use client';

import { createClient } from '@/lib/supabase/client';
import { createFileRecord, uploadFileDirectAction } from '@/lib/actions/files';
import { FileItem } from '@/types';

export async function uploadFileFromBrowser(
  file: File,
  options?: { projectId?: string | null; folderId?: string | null }
): Promise<{ success?: boolean; file?: FileItem; error?: string; storedIn?: string }> {
  if (!file || file.size === 0) {
    return { error: 'The selected file is empty.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Please sign in before uploading files.' };
  }

  const fileId = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'untitled';
  const storagePath = `${user.id}/${fileId}/${sanitizedName}`;

  const { error: uploadErr } = await supabase.storage.from('project-files').upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
    cacheControl: '3600',
  });

  if (!uploadErr) {
    const record = await createFileRecord({
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      project_id: options?.projectId || null,
      folder_id: options?.folderId || null,
    });

    if (record.error) {
      return { error: record.error };
    }

    return { success: true, file: record.file, storedIn: 'cloud' };
  }

  const formData = new FormData();
  formData.append('file', file);
  if (options?.projectId) formData.append('project_id', options.projectId);
  if (options?.folderId) formData.append('folder_id', options.folderId);

  const fallback = await uploadFileDirectAction(formData);
  if (fallback.error) {
    const message = fallback.error.toLowerCase();
    if (message.includes('bucket') || message.includes('not found') || message.includes('row-level security')) {
      return {
        error:
          "Storage is not ready yet. In Supabase → SQL Editor, run the `project-files` bucket migration, then try again.",
      };
    }
    return { error: fallback.error };
  }

  return fallback;
}
