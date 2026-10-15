import { createClient } from '@/lib/supabase/server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

export function hasGoogleOAuthCredentials(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const isPlaceholder = (value: string | undefined) =>
    !value || /(your[-_ ]|placeholder|example)/i.test(value);

  return !isPlaceholder(clientId) && !isPlaceholder(clientSecret);
}

export function getGoogleOAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const scope = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  userInfo?: { email?: string; name?: string; picture?: string };
  error?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error_description || data.error || 'Failed to exchange token' } as any;
    }

    // Fetch user info
    let userInfo = undefined;
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        userInfo = await userRes.json();
      }
    } catch (e) {
      console.error('Failed to fetch Google user info', e);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      userInfo,
    };
  } catch (err: any) {
    return { error: err.message || 'Network error during Google OAuth exchange' } as any;
  }
}

export async function refreshGoogleToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Google refresh error:', data);
      return null;
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  } catch (e) {
    console.error('Failed to refresh token', e);
    return null;
  }
}

export async function fetchDriveFilesWithToken(
  accessToken: string,
  query?: string
): Promise<GoogleDriveFile[]> {
  try {
    let q = "trashed = false";
    if (query && query.trim()) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    const params = new URLSearchParams({
      pageSize: '50',
      fields: 'files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink, modifiedTime, shared, owners)',
      q,
      orderBy: 'modifiedTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('Failed to list Drive files', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error fetching Google Drive files', err);
    return [];
  }
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string | null
): Promise<{ success: boolean; file?: GoogleDriveFile; error?: string }> {
  try {
    const boundary = '-------ProjectHubBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: mimeType || 'application/octet-stream',
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,iconLink,thumbnailLink,modifiedTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Google Drive Upload error:', errText);
      return { success: false, error: errText };
    }

    const driveFile = (await res.json()) as GoogleDriveFile;
    return { success: true, file: driveFile };
  } catch (err: any) {
    console.error('Error uploading to Google Drive:', err);
    return { success: false, error: err.message || 'Failed to upload to Google Drive' };
  }
}

export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string | null
): Promise<{ success: boolean; folder?: GoogleDriveFile; error?: string }> {
  try {
    const metadata: Record<string, any> = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const folder = (await res.json()) as GoogleDriveFile;
    return { success: true, folder };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create folder on Drive' };
  }
}

export async function fetchDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    // 1. First get metadata to see mimeType
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) {
      return { success: false, error: 'Could not find file on Google Drive' };
    }

    const meta = await metaRes.json();
    const mimeType = meta.mimeType || '';

    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    // For Google Docs/Sheets, export as plain text or markdown/csv
    if (mimeType.includes('google-apps.document')) {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    } else if (mimeType.includes('google-apps.spreadsheet')) {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    }

    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to retrieve file content from Google Drive' };
    }

    const text = await res.text();
    // Return up to 60,000 characters for Gemini analysis
    return { success: true, content: text.slice(0, 60000) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error reading Drive file content' };
  }
}

