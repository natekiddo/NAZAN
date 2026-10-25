'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

const sans = Hanken_Grotesk({ subsets: ['latin'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });

export const displayFont = sans.className;
export const monoFont = mono.className;

/* ── Button & link tokens matching the reference image ── */
export const primaryButton =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d0d11] px-6 py-3.5 text-sm font-medium text-white border border-white/15 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6)] transition-all duration-200 hover:bg-[#1c1c24] hover:border-white/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

export const linkClass = 'text-white underline-offset-4 hover:underline transition-colors';

/* ── Heading matching the reference image ──────────────── */
export function AuthHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

/* ── Error / Success alerts ───────────────────────────── */
export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 backdrop-blur-md"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-3 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 backdrop-blur-md"
    >
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
      <span>{message}</span>
    </div>
  );
}

/* ── Form field matching the rounded-pill input style ─── */
type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  labelRight?: React.ReactNode;
};

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  minLength,
  autoComplete,
  labelRight,
}: FieldProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <label
          htmlFor={id}
          className="text-[11px] font-medium text-zinc-300"
        >
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-full border border-white/12 bg-white/[0.06] py-2.5 pl-4 text-xs sm:text-sm text-white placeholder:text-zinc-500 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/20 focus:border-white/35 focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-white/10 ${
            isPassword ? 'pr-11' : 'pr-4'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-white transition-colors focus:outline-none"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Auth Shell with IDENTICAL frame size for Login & Sign up ── */
export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className={`${sans.className} ph-auth relative min-h-screen overflow-hidden`}>
      <div className="ph-auth-glow ph-auth-glow-one" aria-hidden="true" />
      <div className="ph-auth-glow ph-auth-glow-two" aria-hidden="true" />
      <header className="ph-auth-header">
        <Link href="/" className="ph-auth-brand"><span className="ph-auth-mark">P</span><span>PROJECTHUB</span></Link>
        <Link href="/" className="ph-auth-home">Back to home <span>↗</span></Link>
      </header>
      <div className="ph-auth-stage">
        <div className="ph-auth-card">
          <section className="ph-auth-form">
            <div className="ph-auth-mobile-brand"><span className="ph-auth-mark">P</span><span>PROJECTHUB / ACCOUNT</span></div>
            <div className="ph-auth-form-content">{children}</div>
            <div className="ph-auth-footer">{footer}</div>
          </section>
          <aside className="ph-auth-art">
            <div className="ph-auth-art-nav"><span>PROJECTHUB / WORKSPACE</span><span>PROJECT MEMORY</span><span>OPEN PROJECT <b>↗</b></span></div>
            <h2 className="ph-auth-art-title"><span>Welcome to</span><br /><em>ProjectHub.</em></h2>
            <div className="ph-auth-art-grid" aria-hidden="true" />
                        
              
            <span className="ph-auth-art-node ph-auth-art-node-a">01 <b>Progress</b></span>
            <span className="ph-auth-art-node ph-auth-art-node-b">02 <b>Context</b></span>
            <span className="ph-auth-art-node ph-auth-art-node-c">03 <b>Next step</b></span>
            <div className="ph-auth-art-caption"><span>WORK, WITH CONTEXT</span><p>Your next step is waiting.</p></div>
            <span className="ph-auth-art-index">PH / 01</span>
          </aside>
        </div>
        <p className="ph-auth-legal">A clearer way to keep meaningful work moving.</p>
      </div>
    </main>
  );
}