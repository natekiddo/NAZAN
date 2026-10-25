'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  AuthShell,
  AuthError,
  AuthSuccess,
  Field,
  primaryButton,
  linkClass,
} from '@/components/auth/auth-shell';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <AuthShell
      footer={
        <Link href="/login" className={`${linkClass} inline-flex items-center gap-2`}>
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">
          Reset password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/40">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && <AuthError message={error} />}
      {success && (
        <AuthSuccess message="Password reset link sent! Check your email inbox." />
      )}

      {!success && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Field
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <button type="submit" disabled={loading} className={`${primaryButton} mt-7!`}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
