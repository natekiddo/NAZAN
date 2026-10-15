'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { WorkspaceRole } from '@/types';
import { inviteWorkspaceMember } from '@/lib/actions/workspaces';

interface InviteMemberModalProps {
  workspaceId: string;
  memberCount: number;
  maxFreeMembers: number;
  isFreePlan: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({
  workspaceId,
  memberCount,
  maxFreeMembers = 2,
  isFreePlan,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const isAtLimit = isFreePlan && memberCount >= maxFreeMembers;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await inviteWorkspaceMember(workspaceId, email.trim(), role);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
      if (res.requiresUpgrade) {
        setRequiresUpgrade(true);
      }
    } else if (res.inviteUrl) {
      const localUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/invite/${res.token}`
          : res.inviteUrl;
      setGeneratedInviteUrl(localUrl);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Invite Teammate</h3>
              <p className="text-xs text-slate-400">
                Send an invitation to collaborate in this workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Limit Warning */}
        {isAtLimit && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Free Plan Limit Reached (2 / 2 Members)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-300/90">
              Free workspaces support up to 2 members (including the owner). An active Team subscription is required to invite a 3rd member.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Upgrade to Team Plan</span>
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-2">
            <p>{error}</p>
            {requiresUpgrade && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 font-bold hover:underline"
              >
                View Plans &amp; Upgrade Options &rarr;
              </Link>
            )}
          </div>
        )}

        {/* Generated Invite Success View */}
        {generatedInviteUrl ? (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Invitation Created Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-300/90">
                Share this secure link with <strong>{email}</strong>. It will expire in 7 days.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-400 font-semibold text-[11px]">
                Direct Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Invite Form */
          <form onSubmit={handleInvite} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Collaborator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  disabled={isAtLimit}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Assigned Role
              </label>
              <select
                value={role}
                disabled={isAtLimit}
                onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="member">Member — Standard collaborator</option>
                <option value="admin">Admin — Delegated workspace management</option>
                <option value="guest">Guest — Read-only / limited collaborator</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                You can customize granular permissions individually for this member at any time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || isAtLimit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all cursor-pointer shadow-sm"
              >
                {isSubmitting ? 'Generating Invite...' : 'Generate Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
