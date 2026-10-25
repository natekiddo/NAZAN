'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { FileItem, Folder } from '@/types';

export interface CreateFileInput {
  original_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  project_id?: string | null;
  folder_id?: string | null;
  task_id?: string | null;
  checksum?: string | null;
}

export async function createFileRecord(input: CreateFileInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // 1. Insert file record
  const { data: fileData, error: fileError } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      original_name: input.original_name,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      file_size: input.file_size,
      project_id: input.project_id || null,
      folder_id: input.folder_id || null,
      task_id: input.task_id || null,
      checksum: input.checksum || null,
      source: 'upload',
      is_trashed: false,
    } as any)
    .select()
    .single();

  if (fileError) {
    return { error: fileError.message };
  }

  // 2. Insert initial version (v1)
  await supabase.from('file_versions').insert({
    file_id: fileData.id,
    user_id: user.id,
    version_number: 1,
    storage_path: input.storage_path,
    file_size: input.file_size,
    checksum: input.checksum || null,
  } as any);

  // 3. Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'uploaded_file',
    entity_type: 'file',
    entity_id: fileData.id,
    details: {
      name: input.original_name,
      file_size: input.file_size,
      project_id: input.project_id,
    },
  } as any);

  revalidatePath('/files');
  if (input.project_id) {
    revalidatePath(`/projects/${input.project_id}`);
  }

  return { file: fileData as FileItem };
}

export async function getSignedFileUrl(fileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // Get file record to verify ownership
  const { data: file, error: fetchErr } = await supabase
    .from('files')
    .select('storage_path, original_name')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !file) {
    return { error: fetchErr?.message || 'File not found' };
  }

  // Create signed URL valid for 60 minutes
  const { data: signedData, error: signErr } = await supabase
    .storage
    .from('project-files')
    .createSignedUrl(file.storage_path, 3600, {
      download: file.original_name,
    });

  if (signErr) {
    return { error: signErr.message };
  }

  return { signedUrl: signedData.signedUrl, originalName: file.original_name };
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  // Get file record
  const { data: file } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single();

  if (!file) {
    return { error: 'File not found' };
  }

  // 1. Remove from storage
  await supabase.storage.from('project-files').remove([file.storage_path]);

  // 2. Delete record from database
  const { error: delErr } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', user.id);

  if (delErr) {
    return { error: delErr.message };
  }

  // 3. Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'deleted_file',
    entity_type: 'file',
    entity_id: fileId,
    details: {
      name: file.original_name,
      project_id: file.project_id,
    },
  } as any);

  revalidatePath('/files');
  if (file.project_id) {
    revalidatePath(`/projects/${file.project_id}`);
  }

  return { success: true };
}

export async function renameFile(fileId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('files')
    .update({ original_name: newName.trim(), updated_at: new Date().toISOString() } as any)
    .eq('id', fileId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/files');
  return { success: true };
}

export async function moveFile(fileId: string, targetFolderId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('files')
    .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() } as any)
    .eq('id', fileId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/files');
  return { success: true };
}

export async function createFolder(
  name: string,
  projectId?: string | null,
  parentId?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
      project_id: projectId || null,
      parent_id: parentId || null,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/files');
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  return { folder: data as Folder };
}

export async function deleteFolder(folderId: string, projectId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/files');
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  return { success: true };
}

export async function getProjectFilesForDownload(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: files, error } = await supabase
    .from('files')
    .select('id, original_name, storage_path, file_size')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('is_trashed', false);

  if (error) {
    return { error: error.message };
  }

  // Generate signed URLs for each file
  const signedFiles = await Promise.all(
    (files || []).map(async (f) => {
      const { data } = await supabase.storage
        .from('project-files')
        .createSignedUrl(f.storage_path, 3600);
      return {
        id: f.id,
        name: f.original_name,
        signedUrl: data?.signedUrl || null,
        size: f.file_size,
      };
    })
  );

  return { files: signedFiles.filter((f) => f.signedUrl !== null) };
}

export async function uploadFileDirectAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first' };
  }

  const file = formData.get('file') as File;
  const projectId = formData.get('project_id') as string | null;
  const folderId = formData.get('folder_id') as string | null;

  if (!file) {
    return { error: 'No file provided' };
  }

  const fileId = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${user.id}/${fileId}/${sanitizedName}`;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try uploading to private bucket 'project-files'
    const { error: uploadErr } = await supabase.storage
      .from('project-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('Supabase storage upload error:', uploadErr.message);
      if (
        uploadErr.message?.toLowerCase().includes('bucket not found') ||
        uploadErr.message?.toLowerCase().includes('not found')
      ) {
        return {
          error:
            "Storage bucket 'project-files' does not exist in Supabase yet. Please run migration 'supabase/migrations/20261010000001_storage_setup.sql' in your Supabase SQL Editor.",
        };
      }
      return { error: `Storage upload error: ${uploadErr.message}` };
    }

    // Insert metadata record in PostgreSQL
    const res = await createFileRecord({
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      project_id: projectId || null,
      folder_id: folderId || null,
    });

    if (res.error) {
      return { error: res.error };
    }

    revalidatePath('/files');
    if (projectId) revalidatePath(`/projects/${projectId}`);
    return { success: true, file: res.file };
  } catch (err: any) {
    return { error: err?.message || 'Server error during upload' };
  }
}

