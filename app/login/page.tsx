'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AuthError,
  AuthHeading,
  AuthShell,
  Field,
  linkClass,
  monoFont,
  primaryButton,
} from '@/components/auth/auth-shell';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <AuthShell
      footer={
        <>
          New to ProjectHub?{' '}
          <Link href="/signup" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <AuthHeading title="Welcome back." text="Sign in to pick up where your best work left off." />

      {error && <AuthError message={error} />}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />

        <Field
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
          labelRight={
            <Link
              href="/forgot-password"
              className={`${monoFont} text-[11px] uppercase tracking-[0.06em] text-[#2E5A82] underline-offset-4 hover:underline dark:text-[#CFE0EE]`}
            >
              Forgot password?
            </Link>
          }
        />

        <button type="submit" disabled={loading} className={`${primaryButton} mt-7!`}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}