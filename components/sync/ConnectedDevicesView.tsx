'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Monitor,
  Plus,
  Trash2,
  Pause,
  Play,
  RotateCw,
  Folder,
  Shield,
  FileCode,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { ConnectedDevice } from '@/types';
import { registerDevice, revokeDevice, pauseResumeDevice } from '@/lib/actions/sync';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ConnectedDevicesViewProps {
  devices: ConnectedDevice[];
}

export default function ConnectedDevicesView({ devices }: ConnectedDevicesViewProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');
  const [syncFolderPath, setSyncFolderPath] = useState('C:\\Users\\Developer\\ProjectHub');
  const [loading, setLoading] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<'newer_wins' | 'server_wins' | 'client_wins' | 'keep_both'>('newer_wins');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setLoading(true);
    await registerDevice({
      device_name: deviceName.trim(),
      device_type: deviceType,
      sync_folder_path: syncFolderPath.trim(),
    });
    setLoading(false);
    setIsModalOpen(false);
    setDeviceName('');
    router.refresh();
  };

  const handleRevoke = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke sync access for "${name}"?`)) {
      await revokeDevice(id);
      router.refresh();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    await pauseResumeDevice(id, currentStatus);
    router.refresh();
  };

  const defaultIgnorePatterns = [
    'node_modules/',
    '.git/',
    '.next/',
    'dist/',
    'build/',
    'out/',
    '*.tmp',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    '.env.local',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" />
            Connected Desktop Devices ({devices.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Devices authorized to sync local project folders with your ProjectHub workspace.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Connect New Device
        </button>
      </div>

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Monitor className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            No desktop clients connected
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Connect your developer workstation to synchronize project files and code snapshots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => {
            const isPaused = device.status === 'paused';
            return (
              <div
                key={device.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                      {device.device_type === 'laptop' ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {device.device_name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {device.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      isPaused
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                {device.sync_folder_path && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{device.sync_folder_path}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Last synced {device.last_synced_at ? formatDate(device.last_synced_at) : 'Never'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(device.id, device.status)}
                      title={isPaused ? 'Resume Sync' : 'Pause Sync'}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                    </button>

                    <button
                      onClick={() => handleRevoke(device.id, device.device_name)}
                      title="Revoke Device"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sync Strategy & Conflict Resolution */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Conflict Resolution Strategy
        </h3>
        <p className="text-xs text-slate-500">
          How ProjectHub should resolve simultaneous edits between your desktop client and the server:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              id: 'newer_wins',
              label: 'Newer Timestamp Wins (Recommended)',
              desc: 'Automatically keeps whichever file has the more recent edit timestamp.',
            },
            {
              id: 'keep_both',
              label: 'Keep Both (Create Conflict Copy)',
              desc: 'Preserves server version and creates a <name>.conflict copy for review.',
            },
            {
              id: 'client_wins',
              label: 'Client Wins',
              desc: 'Desktop file always overwrites the remote server file.',
            },
            {
              id: 'server_wins',
              label: 'Server Wins',
              desc: 'Remote server file always overwrites local changes.',
            },
          ].map((strat) => (
            <label
              key={strat.id}
              onClick={() => setConflictStrategy(strat.id as any)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                conflictStrategy === strat.id
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                type="radio"
                name="conflict_strategy"
                checked={conflictStrategy === strat.id}
                onChange={() => setConflictStrategy(strat.id as any)}
                className="mt-0.5 text-indigo-600"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {strat.label}
                </span>
                <span className="text-[11px] text-slate-500 block leading-relaxed">
                  {strat.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Sync Ignore Patterns */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-500" />
          Ignored Files &amp; Build Artifacts
        </h3>
        <p className="text-xs text-slate-500">
          The local sync engine skips heavy dependency directories, build folders, and sensitive local secrets:
        </p>

        <div className="flex flex-wrap gap-1.5">
          {defaultIgnorePatterns.map((pat) => (
            <span
              key={pat}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {pat}
            </span>
          ))}
        </div>
      </div>

      {/* Register Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Connect Desktop Sync Client
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Workstation PC or MacBook Pro"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Type
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="desktop">Desktop Workstation</option>
                  <option value="laptop">Laptop</option>
                  <option value="server">Local Home Server</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Local Sync Folder Path
                </label>
                <input
                  type="text"
                  value={syncFolderPath}
                  onChange={(e) => setSyncFolderPath(e.target.value)}
                  placeholder="C:\Users\You\ProjectHub or ~/ProjectHub"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !deviceName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
