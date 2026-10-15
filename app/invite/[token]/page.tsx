import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { acceptWorkspaceInvitation } from '@/lib/actions/workspaces';
import AcceptInviteButton from './AcceptInviteButton';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch invitation
  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .select('*, workspace:workspaces(*), inviter:profiles(*)')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Invalid or Expired Invitation</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This invitation link is either invalid, revoked, or has expired. Please contact the workspace owner to request a new invitation.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Return to ProjectHub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const workspace = invitation.workspace;
  const inviter = invitation.inviter;
  const inviterName = inviter?.full_name || inviter?.email?.split('@')[0] || 'A team member';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 text-center">
        {/* Workspace Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <Layers className="w-8 h-8" />
        </div>

        {/* Invite Title */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25">
            Workspace Invitation
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Join {workspace?.name || 'Workspace'}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            <strong>{inviterName}</strong> invited you to collaborate as a{' '}
            <strong className="text-indigo-300 uppercase">{invitation.role}</strong> on ProjectHub.
          </p>
        </div>

        {/* Invitation Metadata Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center text-slate-400">
            <span>Invited Email:</span>
            <span className="font-mono text-slate-200">{invitation.email}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Role:</span>
            <span className="font-bold uppercase text-indigo-400">{invitation.role}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Workspace Plan:</span>
            <span className="font-semibold text-slate-200 uppercase">{workspace?.plan || 'Free'}</span>
          </div>
        </div>

        {/* Action Button */}
        {user ? (
          <AcceptInviteButton token={token} />
        ) : (
          <div className="space-y-3 pt-1">
            <Link
              href={`/login?next=/invite/${token}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Sign in to Accept Invitation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href={`/signup?next=/invite/${token}`} className="text-indigo-400 hover:underline font-semibold">
                Sign up free
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
