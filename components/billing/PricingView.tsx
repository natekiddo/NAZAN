'use client';

import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Users,
  Video,
  MessageSquare,
  HardDrive,
  Loader2,
  CheckCircle2,
  Crown,
  HelpCircle,
} from 'lucide-react';
import { Workspace, WorkspaceMember } from '@/types';
import { PRICING_PLANS } from '@/lib/payments/types';
import { upgradeWorkspacePlanAction, downgradeWorkspacePlanAction } from '@/lib/actions/billing';
import { useRouter } from 'next/navigation';

interface PricingViewProps {
  workspace: Workspace;
  members: WorkspaceMember[];
  isOwner: boolean;
  isUpgradedNotice?: boolean;
}

export default function PricingView({
  workspace,
  members,
  isOwner,
  isUpgradedNotice,
}: PricingViewProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'ETB'>('ETB');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTeamPlan = workspace.plan === 'team' || workspace.plan === 'pro';

  const handleUpgrade = async () => {
    if (!isOwner) {
      alert('Only the workspace owner can manage subscriptions and billing.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await upgradeWorkspacePlanAction(workspace.id, 'chapa');
      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        router.refresh();
        setLoading(false);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Upgrade failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (confirm('Downgrade to Free plan? Workspace will be capped at 2 members.')) {
      setLoading(true);
      await downgradeWorkspacePlanAction(workspace.id);
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Upgraded Success Alert */}
      {(isUpgradedNotice || isTeamPlan) && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Active Pro Team Workspace</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                You have unlimited members, team video calling, and full custom permission matrix enabled!
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
            Active
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Transparent Plans &amp; Billing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Scale effortlessly from individual to high-velocity team
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Collaborate free with up to 2 members. Upgrade to Pro Team when you need more teammates and enterprise controls.
        </p>

        {/* Currency Switcher */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setCurrency('ETB')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currency === 'ETB'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ETB (Chapa / Telebirr)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs rounded-xl max-w-md mx-auto text-center">
          {errorMsg}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div
          className={`p-8 rounded-3xl border transition-all flex flex-col justify-between space-y-6 ${
            !isTeamPlan
              ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Free Starter
                </h3>
                <p className="text-xs text-slate-500">
                  For individual makers, student projects, &amp; duo collaboration.
                </p>
              </div>
              {!isTeamPlan && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Current Plan
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
              <span className="text-4xl font-extrabold">
                {currency === 'ETB' ? '0 ETB' : '$0'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month forever</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Workspace Member Cap:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">2 Members Max</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Currently using {members.length} / 2 seats. 3+ members require Pro Team.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                What's Included:
              </span>
              {PRICING_PLANS[0].features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={true}
            className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold text-xs text-center cursor-default bg-slate-50 dark:bg-slate-800/40"
          >
            {!isTeamPlan ? 'Current Active Tier' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Pro Team Plan */}
        <div
          className={`p-8 rounded-3xl border transition-all flex flex-col justify-between space-y-6 relative ${
            isTeamPlan
              ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
              : 'bg-gradient-to-b from-indigo-900/10 to-transparent dark:from-indigo-950/30 bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3 right-6">
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
              Recommended for Teams
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  Pro Team Plan
                  <Crown className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-500">
                  Unlimited teammates, deep AI briefings, and video conference.
                </p>
              </div>
              {isTeamPlan && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  Current Plan
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
              <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {currency === 'ETB' ? '1,500 ETB' : '$15'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-indigo-950 dark:text-indigo-200">Workspace Member Cap:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Unlimited Members</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Invite as many engineers, reviewers, clients, and guests as needed.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Everything in Free, plus:
              </span>
              {PRICING_PLANS[1].features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {isTeamPlan ? (
              <div className="space-y-2">
                <button
                  disabled={true}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center cursor-default shadow-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Subscribed to Pro Team
                </button>
                {isOwner && (
                  <button
                    onClick={handleDowngrade}
                    disabled={loading}
                    className="w-full text-center text-[11px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Switch to Free plan
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isOwner ? 'Upgrade Workspace to Pro Team' : 'Owner Can Upgrade Plan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Security Footer */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-2 text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            256-bit Encrypted Checkout
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            Supports Telebirr, CBE Birr &amp; Global Cards
          </span>
        </div>
        <p className="text-[11px]">
          Free workspaces are restricted to 2 members. Upgrades take effect immediately across all workspace tools.
        </p>
      </div>
    </div>
  );
}
