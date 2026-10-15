import React from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  Clock,
  Trash2,
  Settings,
  AlertCircle,
  Copy,
  ExternalLink,
  Crown,
  CreditCard,
  FileCode,
} from 'lucide-react';
import {
  getUserWorkspaces,
  getWorkspaceMembers,
  getWorkspaceInvitations,
  getWorkspaceAuditLogs,
} from '@/lib/actions/workspaces';
import WorkspaceMembersView from '@/components/workspaces/WorkspaceMembersView';

export default async function WorkspaceMembersPage() {
  const { workspaces, activeWorkspaceId, isMigrationPending } = await getUserWorkspaces();
  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p>No workspace found. Please select or create a workspace.</p>
      </div>
    );
  }

  const [membersData, invitations, auditLogs] = await Promise.all([
    getWorkspaceMembers(currentWorkspace.id),
    getWorkspaceInvitations(currentWorkspace.id),
    getWorkspaceAuditLogs(currentWorkspace.id),
  ]);

  const {
    members,
    userRole,
    userPermissions,
    isOwner,
    memberCount,
    maxFreeMembers,
  } = membersData;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Migration Notice Banner (if table hasn't been executed in Supabase yet) */}
      {isMigrationPending && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-start gap-2.5">
            <FileCode className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Database Migration Ready</p>
              <p className="text-indigo-300/90 leading-relaxed">
                Run the Phase 2 migration script in your Supabase SQL Editor to persist multi-user workspaces:{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-indigo-500/30 font-mono text-[11px] text-indigo-300">
                  supabase/migrations/20261013000002_workspaces_and_permissions.sql
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Members Management Client View */}
      <WorkspaceMembersView
        workspace={currentWorkspace}
        members={members}
        invitations={invitations}
        auditLogs={auditLogs}
        userRole={userRole}
        userPermissions={userPermissions}
        isOwner={isOwner}
        memberCount={memberCount}
        maxFreeMembers={maxFreeMembers}
      />
    </div>
  );
}
