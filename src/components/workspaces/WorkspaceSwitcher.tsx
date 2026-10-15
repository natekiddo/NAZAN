'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ChevronDown,
  Check,
  Plus,
  Users,
  Settings,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Workspace } from '@/types';
import { setActiveWorkspace, createWorkspace } from '@/lib/actions/workspaces';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = async (wsId: string) => {
    setIsOpen(false);
    await setActiveWorkspace(wsId);
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await createWorkspace(newWsName.trim());
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowCreateModal(false);
      setNewWsName('');
      router.refresh();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all cursor-pointer shadow-xs max-w-[200px]"
        title="Switch Workspace"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/30">
          <Layers className="h-3 w-3" />
        </div>

        <span className="truncate font-semibold text-slate-200">
          {activeWorkspace?.name || 'Workspace'}
        </span>

        <span className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.2 rounded bg-slate-800">
          {activeWorkspace?.plan || 'Free'}
        </span>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 text-xs">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Your Workspaces
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspaceId;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-400">
                      {ws.plan}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-0.5">
            <Link
              href="/workspace/members"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Members &amp; Permissions</span>
            </Link>

            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>Plans &amp; Billing</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Create New Workspace
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Collaborate with friends, students, or colleagues. Free plan supports up to 2 members.
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Team, Mobile App, Research Lab"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-slate-400">
                <span className="font-semibold text-slate-200 block">Workspace Creator Guarantee:</span>
                <p className="text-[11px] leading-relaxed">
                  As the workspace creator, you will automatically be designated the <strong>Owner</strong> with protected administrative authority and control over members&apos; permissions.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newWsName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
