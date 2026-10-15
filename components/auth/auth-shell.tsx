'use client';

import React, { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Anton, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

const anton = Anton({ subsets: ['latin'], weight: '400' });
const sans = Hanken_Grotesk({ subsets: ['latin'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });

export const displayFont = anton.className;
export const monoFont = mono.className;

export const AUTH_IMAGES = [
  { src: '/auth/auth-1.jpg', alt: 'Blue digital octopus rendered in a field of glowing points', caption: 'Ideas in motion.' },
  { src: '/auth/auth-2.jpg', alt: 'Close-up portrait of a pink baboon against a blue background', caption: 'A different perspective.' },
  { src: '/auth/auth-3.jpg', alt: 'Sculptural black-and-white futuristic object', caption: 'Make room for focus.' },
  { src: '/auth/auth-4.jpg', alt: 'Three alpacas wearing colorful sunglasses', caption: 'Bring your team together.' },
  { src: '/auth/auth-5.jpg', alt: 'High-contrast black-and-white portrait illustration', caption: 'Speak up.' },
  { src: '/auth/auth-6.jpg', alt: 'Futuristic portrait in a translucent blue helmet', caption: 'Think beyond limits.' },
  { src: '/auth/auth-7.jpg', alt: 'Green crocodile against a bright pink background', caption: 'Stay on track.' },
  { src: '/auth/auth-8.jpg', alt: 'Abstract flowing black, white, and blue lines', caption: 'Create something bold.' },
];

const SLIDE_MS = 5000;

export const primaryButton =
  `${mono.className} inline-flex w-full items-center justify-center gap-3 rounded-[3px] bg-[#14233B] px-5 py-4 text-xs font-medium uppercase tracking-[0.06em] text-[#CFE0EE] transition-colors hover:bg-[#2E5A82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#CFE0EE] dark:text-[#14233B] dark:hover:bg-white dark:focus-visible:ring-offset-[#060B14]`;

export const linkClass =
  'font-semibold text-[#2E5A82] underline-offset-4 hover:underline dark:text-[#CFE0EE]';

function Bookmark() {
  return (
    <svg width="20" height="24" viewBox="0 0 22 26" aria-hidden="true">
      <path d="M2 0h18a2 2 0 0 1 2 2v24l-11-7L0 26V2a2 2 0 0 1 2-2z" fill="#F5A623" />
    </svg>
  );
}

export function AuthHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8">
      <h1
        className={`${anton.className} text-5xl uppercase leading-[0.95] tracking-[0.005em] text-[#14233B] sm:text-6xl dark:text-[#CFE0EE]`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-[36ch] text-[15px] leading-6 text-[#4a6079] dark:text-[#9fb6cc]">{text}</p>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-[3px] border border-rose-300 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-[3px] border border-emerald-300 bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className={`${mono.className} text-[11px] font-medium uppercase tracking-[0.06em] text-[#14233B] dark:text-[#CFE0EE]`}
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
          className={`w-full rounded-[3px] border border-[#c5d6e6] bg-white py-3.5 pl-4 text-sm text-[#14233B] placeholder:text-[#7d93aa] focus:border-[#14233B] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 dark:border-white/15 dark:bg-[#0a1322] dark:text-[#CFE0EE] dark:placeholder:text-[#6f86a0] dark:focus:border-[#CFE0EE] ${isPassword ? 'pr-12' : 'pr-4'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5a7088] hover:text-[#14233B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] dark:text-[#9fb6cc] dark:hover:text-white"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ImagePanel() {
  const [index, setIndex] = useState(0);

  // Auto-advance. Resets whenever the slide changes (including manual clicks).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setIndex((n) => (n + 1) % AUTH_IMAGES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index]);

  const total = String(AUTH_IMAGES.length).padStart(2, '0');

  return (
    <div className="relative h-full min-h-60 overflow-hidden rounded-[3px] bg-[#0a1322] lg:min-h-140">
      {AUTH_IMAGES.map((img, i) => (
        <div
          key={img.src}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={i === 0}
            className="object-cover saturate-[.7]"
          />
        </div>
      ))}

      {/* Steel-blue tint keeps the artwork aligned with the auth palette. */}
      <div className="absolute inset-0 bg-[#2E5A82]/40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-linear-to-t from-[#060B14] via-[#060B14]/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-8 xl:p-10">
        <p className={`${mono.className} text-[11px] uppercase tracking-[0.06em] text-[#CFE0EE]/80`}>
          {String(index + 1).padStart(2, '0')} / {total}
        </p>
        <p
          aria-live="polite"
          className={`${anton.className} mt-3 max-w-[14ch] text-3xl uppercase leading-[0.95] text-[#CFE0EE] sm:text-5xl xl:text-6xl`}
        >
          {AUTH_IMAGES[index].caption}
        </p>
        <div className="mt-6 flex gap-2">
          {AUTH_IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show picture ${i + 1}`}
              aria-current={i === index}
              className="group py-2 focus:outline-none"
            >
              <span
                className={`block h-0.75 w-8 transition-colors group-focus-visible:outline-2 group-focus-visible:outline-[#F5A623] ${i === index ? 'bg-[#F5A623]' : 'bg-[#CFE0EE]/35 group-hover:bg-[#CFE0EE]/70'}`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main
      className={`${sans.className} min-h-screen bg-linear-to-b from-[#B7CFE5] to-[#8fb0d1] p-3 sm:p-5 dark:from-[#0a1322] dark:to-[#060B14]`}
    >
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-350 overflow-hidden rounded-sm bg-[#EEF3F9] shadow-[0_30px_60px_-30px_rgba(20,35,59,.45)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-2 dark:bg-[#060B14]">
        <section className="order-2 flex flex-col px-6 py-6 sm:px-12 sm:py-9 lg:order-1 lg:px-16">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2.5 text-xl font-semibold tracking-tight text-[#14233B] dark:text-[#CFE0EE]"
          >
            <Bookmark />
            ProjectHub
          </Link>

          <div className="mx-auto flex w-full max-w-105 min-h-150 flex-1 flex-col justify-center py-10">{children}</div>

          <p className="mx-auto w-full max-w-105 border-t border-[#c5d6e6] pt-5 text-sm text-[#4a6079] dark:border-white/10 dark:text-[#9fb6cc]">
            {footer}
          </p>
        </section>

        <div className="order-1 h-[32vh] min-h-60 p-3 lg:order-2 lg:h-auto">
          <ImagePanel />
        </div>
      </div>
    </main>
  );
}