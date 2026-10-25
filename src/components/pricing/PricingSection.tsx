'use client';

import Link from 'next/link';
import { ArrowRight, Check, Moon, Sun } from 'lucide-react';
import BrandMark from '@/components/brand/BrandMark';
import { useTheme } from '@/context/ThemeContext';

export default function PricingSection({ standalone = false }: { standalone?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="pricing-showcase min-h-screen overflow-hidden bg-[var(--background)] px-4 pb-14 pt-5 text-[var(--foreground)] sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Pricing navigation" className="pricing-nav mx-auto flex w-fit items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-1.5">
          <Link href="/" aria-label="ProjectHub home" className="flex h-8 items-center gap-2 rounded-full px-2.5 text-xs font-semibold"><BrandMark size={21} /><span className="hidden sm:inline">ProjectHub</span></Link>
          {standalone && <><a href="/#features" className="pricing-nav-link">Features</a><a href="/#faq" className="pricing-nav-link">FAQ</a></>}
          <span aria-current="page" className="pricing-nav-current">Pricing</span>
          <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="pricing-theme-toggle">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</button>
          <Link href="/login" className="pricing-nav-link">Sign in</Link>
          <Link href="/signup" className="pricing-nav-cta">Get started</Link>
        </nav>

        <div className="pricing-title-wrap" aria-hidden="true"><h1 className="pricing-display-title">Pricing</h1></div>
        <div className="pricing-cards relative z-10 mx-auto -mt-4 grid max-w-4xl gap-4 sm:-mt-8 md:grid-cols-2 md:gap-5">
          <section className="pricing-showcase-card">
            <p className="pricing-card-kicker">Free workspace</p>
            <h2 className="pricing-tier">Free</h2>
            <p className="pricing-card-copy">A simple place to start organizing your projects and next steps.</p>
            <div className="pricing-card-rule" />
            <p className="pricing-inclusion"><Check size={15} /> Up to two members, including the owner</p>
            <p className="pricing-inclusion"><Check size={15} /> Projects, tasks, and work sessions</p>
            <Link href="/signup" className="pricing-action pricing-action-dark">Get started free <ArrowRight size={15} /></Link>
          </section>
          <section className="pricing-showcase-card pricing-showcase-featured">
            <div className="flex items-center justify-between gap-3"><p className="pricing-card-kicker">Growing teams</p><span className="pricing-model-badge">Subscription required</span></div>
            <h2 className="pricing-tier">3+ members</h2>
            <p className="pricing-card-copy">An active subscription is required when your workspace grows beyond two members.</p>
            <div className="pricing-card-rule" />
            <p className="pricing-inclusion"><Check size={15} /> Paid pricing will be shared when finalized</p>
            <p className="pricing-inclusion"><Check size={15} /> No unconfirmed prices or plan limits</p>
            <a href="mailto:support@projecthub.dev" className="pricing-action pricing-action-outline">Ask about team access <ArrowRight size={15} /></a>
          </section>
        </div>
        <p className="mt-5 text-center text-[10px] text-[var(--muted-foreground)]">Paid pricing has not been published yet.</p>
      </div>
    </main>
  );
}
