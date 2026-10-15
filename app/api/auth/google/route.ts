import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuthUrl, hasGoogleOAuthCredentials } from '@/lib/google-drive';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Support both logged-in Supabase user and local developer session
  const userId = user?.id || 'dev_session_' + Date.now();

  if (!hasGoogleOAuthCredentials()) {
    return NextResponse.redirect(
      new URL('/drive?error=missing_credentials', appUrl)
    );
  }

  const authUrl = getGoogleOAuthUrl(userId);
  return NextResponse.redirect(authUrl);
}
