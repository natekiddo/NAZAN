'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
    <div className="auth-page relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 sm:left-8 sm:top-8"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17241b] text-[#c5f27d]">
          <Sparkles className="h-4 w-4" />
        </span>
        ProjectHub
      </Link>
      <div className="auth-card w-full max-w-[430px] p-7 sm:p-9">
        <div className="mb-7">
          <span className="auth-mark mb-5">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">
            Reset your password.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/50">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Password reset link sent!</span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Check your email inbox for instructions to reset your password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#78975b] focus:outline-none focus:ring-2 focus:ring-[#78975b]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-primary-button w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
