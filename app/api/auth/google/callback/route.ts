import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens } from '@/lib/google-drive';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateUserId = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/drive?error=${encodeURIComponent(error || 'cancelled')}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const targetUserId = user?.id || stateUserId;
  if (!targetUserId) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const tokenRes = await exchangeCodeForTokens(code);
  if (tokenRes.error || !tokenRes.access_token) {
    return NextResponse.redirect(
      `${appUrl}/drive?error=${encodeURIComponent(tokenRes.error || 'Token exchange failed')}`
    );
  }

  const expiresAt = new Date(Date.now() + tokenRes.expires_in * 1000).toISOString();

  // Create redirect response
  const redirectResponse = NextResponse.redirect(`${appUrl}/drive?connected=true`);

  // 1. Store tokens in secure HTTP-only cookie for failproof immediate access
  const authPayload = JSON.stringify({
    access_token: tokenRes.access_token,
    refresh_token: tokenRes.refresh_token || null,
    expires_at: expiresAt,
    user_id: targetUserId,
    email: tokenRes.userInfo?.email,
    name: tokenRes.userInfo?.name,
  });

  redirectResponse.cookies.set('projecthub_gdrive_auth', authPayload, {
    httpOnly: true,
    secure: false, // allow localhost
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  // 2. Also attempt saving to database in background (non-blocking)
  try {
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    await db
      .from('integrations')
      .upsert(
        {
          user_id: targetUserId,
          provider: 'google_drive',
          access_token: tokenRes.access_token,
          refresh_token: tokenRes.refresh_token || null,
          expires_at: expiresAt,
          scope: tokenRes.scope,
          status: 'active',
          metadata: tokenRes.userInfo || {},
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id,provider' }
      );
  } catch (err) {
    console.warn('Database save skipped, continuing with session cookie:', err);
  }

  return redirectResponse;
}
