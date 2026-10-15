'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  Clock,
  Trash2,
  Settings,
  AlertTriangle,
  Copy,
  Check,
  Crown,
  CreditCard,
  Shield,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
  WorkspacePermissions,
  WorkspaceAuditLog,
} from '@/types';
import MemberPermissionsModal from './MemberPermissionsModal';
import InviteMemberModal from './InviteMemberModal';
import {
  removeWorkspaceMember,
  transferWorkspaceOwnership,
  revokeWorkspaceInvitation,
} from '@/lib/actions/workspaces';

interface WorkspaceMembersViewProps {
  workspace: Workspace;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  auditLogs?: WorkspaceAuditLog[];
  userRole: WorkspaceRole;
  userPermissions: WorkspacePermissions;
  isOwner: boolean;
  memberCount: number;
  maxFreeMembers: number;
}

export default function WorkspaceMembersView({
  workspace,
  members,
  invitations,
  auditLogs = [],
  userRole,
  userPermissions,
  isOwner,
  memberCount,
  maxFreeMembers,
}: WorkspaceMembersViewProps) {
  const [selectedMemberForPerms, setSelectedMemberForPerms] = useState<WorkspaceMember | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [memberToTransfer, setMemberToTransfer] = useState<WorkspaceMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const router = useRouter();
  const isFreePlan = workspace.plan === 'free';
  const isAtFreeLimit = isFreePlan && memberCount >= maxFreeMembers;

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsProcessing(true);
    setActionError(null);

    const res = await removeWorkspaceMember(workspace.id, memberToRemove.id);
    setIsProcessing(false);

    if (res.error) {
      setActionError(res.error);
    } else {
      setMemberToRemove(null);
      router.refresh();
    }
  };

  const handleTransferOwnership = async () => {
    if (!memberToTransfer) return;
    setIsProcessing(true);
    setActionError(null);

    const res = await transferWorkspaceOwnership(workspace.id, memberToTransfer.id);
    setIsProcessing(false);

    if (res.error) {
      setActionError(res.error);
    } else {
      setMemberToTransfer(null);
      router.refresh();
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await revokeWorkspaceInvitation(inviteId);
    router.refresh();
  };

  const handleCopyInviteLink = (token: string) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    navigator.clipboard.writeText(`${appUrl}/invite/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-7">
      {/* 1. Header & Membership Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {workspace.name} — Members &amp; Permissions
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            The person who created this workspace and the invite link has full decision rights: roles, permissions, files, billing, and removals.
          </p>
        </div>

        {/* Plan Limit Pill & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Member quota meter */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Plan: <strong className="text-white uppercase">{workspace.plan}</strong></span>
              <span className="font-semibold text-slate-200">
                {memberCount} / {isFreePlan ? maxFreeMembers : '∞'} Members
              </span>
            </div>
            {isFreePlan && (
              <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtFreeLimit ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (memberCount / maxFreeMembers) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {(isOwner || userPermissions.can_invite_members) && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--primary-foreground)] text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Teammate</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl">
          {actionError}
        </div>
      )}

      {/* 2. Active Members List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Active Collaborators ({members.length})
          </h2>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Your Role:</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-bold uppercase text-[10px]">
              {userRole}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {members.map((member) => {
            const memberName =
              member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Member';
            const memberEmail = member.profile?.email || 'No email';
            const isMemberOwner = member.role === 'owner';
            const hasCustomOverrides =
              member.custom_permissions && Object.keys(member.custom_permissions).length > 0;

            return (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 border border-slate-700 uppercase shrink-0">
                    {memberName.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{memberName}</p>

                      {/* Role Pill */}
                      {isMemberOwner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase text-[10px]">
                          <Crown className="w-3 h-3 text-indigo-400" />
                          Owner
                        </span>
                      ) : member.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold uppercase text-[10px]">
                          Admin
                        </span>
                      ) : member.role === 'guest' ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase text-[10px]">
                          Guest
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold uppercase text-[10px]">
                          Member
                        </span>
                      )}

                      {hasCustomOverrides && !isMemberOwner && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                          Custom Overrides
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono">{memberEmail}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                  {/* Permissions Button */}
                  <button
                    onClick={() => setSelectedMemberForPerms(member)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isMemberOwner ? 'View Permissions' : 'Permissions'}</span>
                  </button>

                  {/* Transfer Ownership (Only current owner can transfer to non-owner) */}
                  {isOwner && !isMemberOwner && (
                    <button
                      onClick={() => setMemberToTransfer(member)}
                      title="Transfer workspace ownership"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Transfer</span>
                    </button>
                  )}

                  {/* Remove Button (Owner cannot be removed) */}
                  {(isOwner || userPermissions.can_remove_members) && !isMemberOwner && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      title="Remove member from workspace"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Pending & Historical Invitations */}
      <section className="space-y-4 pt-2">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-400" />
          Workspace Invitations ({invitations.length})
        </h2>

        {invitations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            <Mail className="w-6 h-6 mx-auto text-slate-600 mb-2" />
            <p>No pending invitations. Click &quot;Invite Teammate&quot; above to invite collaborators.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden text-xs">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{inv.email}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                      Role: {inv.role}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                        inv.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-400'
                          : inv.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {inv.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleCopyInviteLink(inv.token)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Workspace Security Audit Log */}
      {(isOwner || userPermissions.can_view_activity) && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Workspace Security &amp; Audit Trail ({auditLogs.length})
            </h2>
            <span className="text-[11px] text-slate-400">
              Immutable activity records
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              <ShieldCheck className="w-5 h-5 mx-auto text-slate-600 mb-1.5" />
              <p>No audit events recorded yet. Sensitive actions like permission updates and role changes are logged here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden text-xs">
              {auditLogs.map((log) => {
                const actorName = log.actor?.full_name || log.actor?.email?.split('@')[0] || 'System';
                const formattedAction = log.action.replace(/_/g, ' ').toUpperCase();

                return (
                  <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-850/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300 font-mono">
                          {formattedAction}
                        </span>
                        <span className="text-slate-300 font-medium">
                          by <strong className="text-white">{actorName}</strong>
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-slate-400 truncate max-w-lg">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Permissions Modal */}
      {selectedMemberForPerms && (
        <MemberPermissionsModal
          workspaceId={workspace.id}
          member={selectedMemberForPerms}
          isCurrentUserOwner={isOwner}
          onClose={() => setSelectedMemberForPerms(null)}
          onSuccess={() => {
            setSelectedMemberForPerms(null);
            router.refresh();
          }}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          workspaceId={workspace.id}
          memberCount={memberCount}
          maxFreeMembers={maxFreeMembers}
          isFreePlan={isFreePlan}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            router.refresh();
          }}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Remove Collaborator?</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>{memberToRemove.profile?.full_name || memberToRemove.profile?.email}</strong> from this workspace? They will immediately lose access to protected projects and files.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRemoveMember}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all cursor-pointer shadow-sm"
              >
                {isProcessing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Confirmation Dialog */}
      {memberToTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Crown className="w-5 h-5 shrink-0" />
              <span>Transfer Workspace Ownership</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              You are transferring primary ownership to <strong>{memberToTransfer.profile?.full_name || memberToTransfer.profile?.email}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Ownership Transfer Rules:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>The new owner will gain absolute administrative authority.</li>
                <li>Your role will become <strong>Administrator</strong>.</li>
                <li>Only the new owner will be able to manage billing or transfer ownership in the future.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToTransfer(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleTransferOwnership}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-sm"
              >
                {isProcessing ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
