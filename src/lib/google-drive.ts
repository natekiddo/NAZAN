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
    'https://www.googleapis.com/auth/drive.readonly',
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
