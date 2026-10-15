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
  AuthSuccess,
  Field,
  linkClass,
  primaryButton,
} from '@/components/auth/auth-shell';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // New: client-side check only. Remove this block and the confirm field to go back to the original form.
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Account created successfully! Redirecting to dashboard...');
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1500);
  };

  return (
    <AuthShell
      footer={
        <>
          Already have a workspace?{' '}
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <AuthHeading title="Make it yours." text="Set up your workspace and bring all your work together." />

      {error && <AuthError message={error} />}
      {successMessage && <AuthSuccess message={successMessage} />}

      <form onSubmit={handleSignUp} className="space-y-4">
        <Field
          label="Full name"
          required
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          placeholder="Natty Developer"
        />

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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
        />

        <Field
          label="Confirm password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your password"
        />

        <button type="submit" disabled={loading} className={`${primaryButton} mt-7!`}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}