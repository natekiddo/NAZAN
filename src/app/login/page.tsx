'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AuthError,
  AuthHeading,
  AuthShell,
  Field,
  linkClass,
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
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={linkClass}>
            Sign up
          </Link>
        </>
      }
    >
      <AuthHeading
        title="Log in"
        text="Access your projects, saved progress, and next steps."
      />

      {error && <AuthError message={error} />}

      <form onSubmit={handleLogin} className="space-y-3.5">
        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
        />

        <Field
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          labelRight={
            <Link
              href="/forgot-password"
              className="text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          }
        />

        <div className="pt-2">
          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              'Log in'
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
