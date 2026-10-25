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

    setSuccessMessage('Account created successfully! Redirecting...');
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1200);
  };

  return (
    <AuthShell
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <AuthHeading
        title="Create account"
        text="Join your workspace to manage projects, AI, and files."
      />

      {error && <AuthError message={error} />}
      {successMessage && <AuthSuccess message={successMessage} />}

      <form onSubmit={handleSignUp} className="space-y-2.5">
        <Field
          label="Full Name"
          required
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          placeholder="John Doe"
        />

        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
        />

        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder="Min 6 chars"
          />

          <Field
            label="Confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat"
          />
        </div>

        <div className="pt-1.5">
          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
