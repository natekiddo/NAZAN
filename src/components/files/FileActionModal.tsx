'use client';

import React, { useState } from 'react';
import { X, Edit3, FolderInput, Trash2, Loader2, Save } from 'lucide-react';
import { renameFile, moveFile, deleteFile } from '@/lib/actions/files';
import { FileItem, Folder } from '@/types';
import { useRouter } from 'next/navigation';

interface FileActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem;
  folders: Folder[];
  onUpdated?: () => void;
}

export default function FileActionModal({
  isOpen,
  onClose,
  file,
  folders,
  onUpdated,
}: FileActionModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rename' | 'move'>('rename');
  const [newName, setNewName] = useState(file.original_name);
  const [targetFolderId, setTargetFolderId] = useState<string>(file.folder_id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await renameFile(file.id, newName.trim());
    if (res.error) {
      setErrorMsg(res.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    onUpdated?.();
    router.refresh();
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await moveFile(file.id, targetFolderId || null);
    if (res.error) {
      setErrorMsg(res.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    onUpdated?.();
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${file.original_name}"? This will delete the file from storage.`)) {
      setLoading(true);
      const res = await deleteFile(file.id);
      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }
      setLoading(false);
      onClose();
      onUpdated?.();
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
              Manage: {file.original_name}
            </h2>
            <p className="text-xs text-slate-500">Rename or move file location</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rename')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              activeTab === 'rename'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Rename
          </button>

          <button
            onClick={() => setActiveTab('move')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              activeTab === 'move'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FolderInput className="w-3.5 h-3.5" />
            Move to Folder
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {activeTab === 'rename' ? (
            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete File
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Name
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMove} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose Destination Folder
                </label>
                <select
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">📁 Root (No Folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderInput className="w-3.5 h-3.5" />}
                  Move File
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
