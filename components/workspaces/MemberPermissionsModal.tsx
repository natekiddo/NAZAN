'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  AlertTriangle,
  FolderGit2,
  CheckSquare,
  HardDrive,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';
import {
  WorkspaceMember,
  WorkspaceRole,
  WorkspacePermissions,
} from '@/types';
import {
  getDefaultRolePermissions,
  getEffectivePermissions,
  PERMISSION_METADATA,
} from '@/lib/permissions';
import {
  updateMemberRole,
  updateMemberCustomPermissions,
} from '@/lib/actions/workspaces';

interface MemberPermissionsModalProps {
  workspaceId: string;
  member: WorkspaceMember;
  isCurrentUserOwner: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberPermissionsModal({
  workspaceId,
  member,
  isCurrentUserOwner,
  onClose,
  onSuccess,
}: MemberPermissionsModalProps) {
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(member.role);
  const [customOverrides, setCustomOverrides] = useState<Partial<WorkspacePermissions>>(
    member.custom_permissions || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmAdmin, setShowConfirmAdmin] = useState(false);

  const isTargetOwner = member.role === 'owner';
  const canEditPermissions = isCurrentUserOwner && !isTargetOwner;
  const roleDefaults = getDefaultRolePermissions(selectedRole);
  const effective = getEffectivePermissions(selectedRole, customOverrides);

  const handleTogglePermission = (key: keyof WorkspacePermissions) => {
    if (isTargetOwner) return; // Owner cannot be restricted
    if (key === 'can_manage_billing' && !isCurrentUserOwner) return; // Billing is owner-only

    const currentVal = effective[key];
    const newVal = !currentVal;

    setCustomOverrides((prev) => ({
      ...prev,
      [key]: newVal,
    }));
  };

  const handleResetToRoleDefaults = () => {
    setCustomOverrides({});
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    // 1. If role changed, update role first
    if (selectedRole !== member.role) {
      const roleRes = await updateMemberRole(workspaceId, member.id, selectedRole);
      if (roleRes.error) {
        setIsSubmitting(false);
        setError(roleRes.error);
        return;
      }
    }

    // 2. Update custom overrides
    const permRes = await updateMemberCustomPermissions(
      workspaceId,
      member.id,
      customOverrides
    );

    setIsSubmitting(false);

    if (permRes.error) {
      setError(permRes.error);
    } else {
      onSuccess();
    }
  };

  const memberName =
    member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Team Member';
  const memberEmail = member.profile?.email || 'No email registered';

  // Group permissions by category
  const categories: Array<{
    id: 'projects' | 'tasks' | 'files' | 'collaboration' | 'admin';
    name: string;
    icon: React.ElementType;
  }> = [
    { id: 'projects', name: 'Projects & Roadmaps', icon: FolderGit2 },
    { id: 'tasks', name: 'Tasks & Boards', icon: CheckSquare },
    { id: 'files', name: 'Google Drive & Cloud Files', icon: HardDrive },
    { id: 'collaboration', name: 'Communication & Calls', icon: MessageSquare },
    { id: 'admin', name: 'Workspace Administration', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Member Permissions Management
              </h3>
              <p className="text-xs text-slate-400">
                Grant custom capabilities individually on top of assigned role defaults
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl">
              {error}
            </div>
          )}

          {/* Member Profile Snapshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 uppercase border border-slate-700">
                {memberName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{memberName}</p>
                <p className="text-slate-400 text-xs font-mono">{memberEmail}</p>
              </div>
            </div>

            {/* Role Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-slate-400 font-semibold">Assigned Role:</span>
              {isTargetOwner ? (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider text-[10px]">
                  Owner (Protected)
                </span>
              ) : (
                <select
                  value={selectedRole}
                  disabled={!canEditPermissions}
                  onChange={(e) => {
                    const newR = e.target.value as WorkspaceRole;
                    if (newR === 'admin') {
                      setShowConfirmAdmin(true);
                    }
                    setSelectedRole(newR);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              )}
            </div>
          </div>

          {/* Owner Notice */}
          {isTargetOwner && (
            <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Workspace Creator / Owner Authority</p>
                <p className="text-[11px] text-indigo-300/90 leading-relaxed mt-0.5">
                  The workspace owner has full administrative priority by default. Owner permissions are immutable and cannot be restricted by custom overrides.
                </p>
              </div>
            </div>
          )}

          {/* Reset Overrides Action */}
          {!isTargetOwner && Object.keys(customOverrides).length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300">
              <span>Custom overrides are active for this member.</span>
              <button
                type="button"
                onClick={handleResetToRoleDefaults}
                className="text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Reset to {selectedRole.toUpperCase()} defaults
              </button>
            </div>
          )}

          {/* Permissions Matrix by Category */}
          <div className="space-y-5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const catKeys = (Object.keys(PERMISSION_METADATA) as Array<keyof WorkspacePermissions>).filter(
                (k) => PERMISSION_METADATA[k].category === cat.id
              );

              return (
                <div key={cat.id} className="space-y-2.5">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    {cat.name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catKeys.map((key) => {
                      const meta = PERMISSION_METADATA[key];
                      const isEnabled = effective[key];
                      const isOverridden = key in customOverrides;
                      const isBillingDisabled = key === 'can_manage_billing' && !isCurrentUserOwner;

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            if (canEditPermissions && !isBillingDisabled) {
                              handleTogglePermission(key);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isTargetOwner || isBillingDisabled
                              ? 'opacity-70 cursor-not-allowed bg-slate-950/40 border-slate-850 border-slate-800'
                              : 'cursor-pointer hover:border-slate-700 bg-slate-950/60 border-slate-800'
                          } ${isEnabled ? 'border-indigo-500/30' : ''}`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200">{meta.label}</span>
                              {isOverridden && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{meta.description}</p>
                          </div>

                          {/* Checkbox Toggle Button */}
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                              isEnabled
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <p className="text-[11px] text-slate-400">
            Permission changes take effect immediately on subsequent requests.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !canEditPermissions}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all cursor-pointer shadow-sm text-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
