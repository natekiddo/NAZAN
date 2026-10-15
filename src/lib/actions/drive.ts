'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  fetchDriveFilesWithToken,
  refreshGoogleToken,
  createDriveFolder,
  GoogleDriveFile,
} from '@/lib/google-drive';
import { Integration, FileItem } from '@/types';

export async function getDriveIntegrationStatus() {
  // 1. Check HTTP-only cookie first (failproof & instant)
  const cookieStore = await cookies();
  const gdriveCookie = cookieStore.get('projecthub_gdrive_auth')?.value;

  if (gdriveCookie) {
    try {
      const data = JSON.parse(gdriveCookie);
      if (data.access_token) {
        return {
          connected: true,
          status: 'active',
          email: data.email || undefined,
          name: data.name || undefined,
          expiresAt: data.expires_at,
        };
      }
    } catch {}
  }

  // 2. Fallback to Supabase database check
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const db = createAdminClient() || supabase;
      const { data } = await db
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_drive')
        .single();

      if (data && data.status === 'active') {
        const metadata = (data.metadata as any) || {};
        return {
          connected: true,
          status: data.status,
          email: metadata.email || undefined,
          name: metadata.name || undefined,
          picture: metadata.picture || undefined,
          expiresAt: data.expires_at,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading integration from database:', err);
  }

  return { connected: false };
}

export async function getUserDriveAccessToken(): Promise<string | null> {
  let token: string | null = null;
  let refreshToken: string | null = null;
  let expiresAt: string | null = null;

  // 1. Read token from cookie first
  const cookieStore = await cookies();
  const gdriveCookie = cookieStore.get('projecthub_gdrive_auth')?.value;

  if (gdriveCookie) {
    try {
      const data = JSON.parse(gdriveCookie);
      token = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = data.expires_at;
    } catch {}
  }

  // 2. Fallback to database if not in cookie
  if (!token) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const db = createAdminClient() || supabase;
        const { data: integration } = await db
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'google_drive')
          .single();

        if (integration?.access_token) {
          token = integration.access_token;
          refreshToken = integration.refresh_token;
          expiresAt = integration.expires_at;
        }
      }
    } catch (err) {
      console.warn('Error fetching token from database:', err);
    }
  }

  if (!token) {
    return null;
  }

  // 3. Attempt token refresh if expired
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() + 60000 : false;
  if (isExpired && refreshToken) {
    try {
      const refreshed = await refreshGoogleToken(refreshToken);
      if (refreshed?.access_token) {
        return refreshed.access_token;
      }
    } catch {}
  }

  return token;
}

export async function fetchUserDriveFiles(searchQuery?: string) {
  let token = await getUserDriveAccessToken();
  let refreshToken: string | null = null;

  // Get refresh token for retry fallback
  const cookieStore = await cookies();
  const gdriveCookie = cookieStore.get('projecthub_gdrive_auth')?.value;
  if (gdriveCookie) {
    try {
      refreshToken = JSON.parse(gdriveCookie).refresh_token;
    } catch {}
  }

  if (!token) {
    return { error: 'Google Drive is not connected', files: [] };
  }

  let files = await fetchDriveFilesWithToken(token, searchQuery);

  if (files.length === 0 && refreshToken) {
    try {
      const refreshed = await refreshGoogleToken(refreshToken);
      if (refreshed?.access_token) {
        token = refreshed.access_token;
        files = await fetchDriveFilesWithToken(token, searchQuery);
      }
    } catch {}
  }

  return { files };
}

export async function linkDriveFileToProject(
  file: GoogleDriveFile,
  projectId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // 1. Insert file reference in files table
  const { data, error } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      project_id: projectId,
      original_name: file.name,
      storage_path: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      mime_type: file.mimeType || 'application/vnd.google-apps.file',
      file_size: parseInt(file.size || '0') || 0,
      source: 'google_drive',
      external_drive_file_id: file.id,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // 2. Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'linked_drive_file',
    entity_type: 'file',
    entity_id: data.id,
    details: {
      name: file.name,
      project_id: projectId,
      drive_id: file.id,
    },
  } as any);

  revalidatePath('/drive');
  revalidatePath('/files');
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { file: data as FileItem };
}

export async function disconnectDriveIntegration() {
  // 1. Clear cookie
  const cookieStore = await cookies();
  cookieStore.delete('projecthub_gdrive_auth');

  // 2. Delete database record if present
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const db = createAdminClient() || supabase;
      await db
        .from('integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_drive');
    }
  } catch (err) {
    console.warn('Error deleting integration from database:', err);
  }

  revalidatePath('/drive');
  return { success: true };
}

export async function linkDriveUrlToProject(
  url: string,
  name: string,
  projectId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first' };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { error: 'Please enter a valid Google Drive URL' };
  }

  let mimeType = 'application/vnd.google-apps.file';
  if (trimmedUrl.includes('docs.google.com/document')) {
    mimeType = 'application/vnd.google-apps.document';
  } else if (trimmedUrl.includes('docs.google.com/spreadsheets')) {
    mimeType = 'application/vnd.google-apps.spreadsheet';
  } else if (trimmedUrl.includes('docs.google.com/presentation')) {
    mimeType = 'application/vnd.google-apps.presentation';
  } else if (trimmedUrl.includes('.pdf') || trimmedUrl.includes('pdf')) {
    mimeType = 'application/pdf';
  }

  const fileName = name.trim() || 'Google Drive Document';

  const { data, error } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      original_name: fileName,
      storage_path: trimmedUrl,
      mime_type: mimeType,
      file_size: 0,
      source: 'google_drive',
      external_drive_file_id: 'url_' + Date.now(),
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'linked_drive_url',
    entity_type: 'file',
    entity_id: data.id,
    details: {
      name: fileName,
      url: trimmedUrl,
      project_id: projectId,
    },
  } as any);

  revalidatePath('/drive');
  revalidatePath('/files');
  if (projectId) revalidatePath(`/projects/${projectId}`);

  return { success: true, file: data as FileItem };
}

export async function setProjectDriveFolder(
  projectId: string,
  folderId: string,
  folderName: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const { error } = await supabase
    .from('projects')
    .update({
      drive_folder_id: folderId,
      drive_folder_name: folderName,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
  revalidatePath('/drive');
  return { success: true };
}

export async function createProjectDriveFolderAction(
  projectId: string,
  folderName?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: User not authenticated' };
  }

  const token = await getUserDriveAccessToken();
  if (!token) {
    return { error: 'Google Drive is not connected. Please connect Google Drive first.' };
  }

  // Get project name if folderName not supplied
  let targetName = folderName?.trim();
  if (!targetName) {
    const { data: proj } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();
    targetName = proj?.name ? `ProjectHub - ${proj.name}` : 'ProjectHub - Project Folder';
  }

  const folderRes = await createDriveFolder(token, targetName);
  if (!folderRes.success || !folderRes.folder) {
    return { error: folderRes.error || 'Failed to create folder on Google Drive' };
  }

  // Update project
  await supabase
    .from('projects')
    .update({
      drive_folder_id: folderRes.folder.id,
      drive_folder_name: folderRes.folder.name,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', projectId);

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'created_project_drive_folder',
    entity_type: 'project',
    entity_id: projectId,
    details: {
      folder_id: folderRes.folder.id,
      folder_name: folderRes.folder.name,
    },
  } as any);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
  revalidatePath('/drive');

  return { success: true, folder: folderRes.folder };
}

