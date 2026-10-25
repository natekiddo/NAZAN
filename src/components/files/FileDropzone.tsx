'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderGit2,
  Folder as FolderIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileText,
  FileCode2,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import { uploadFileDirectAction } from '@/lib/actions/files';
import { Project, Folder } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FileDropzoneProps {
  projects: Project[];
  folders: Folder[];
  currentProjectId?: string | null;
  currentFolderId?: string | null;
  onUploaded?: () => void;
  onClose?: () => void;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export default function FileDropzone({
  projects,
  folders,
  currentProjectId,
  currentFolderId,
  onUploaded,
  onClose,
}: FileDropzoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProjectId || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || '');
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedMigration, setCopiedMigration] = useState(false);

  const availableFolders = folders.filter((f) => {
    if (selectedProjectId) {
      return !f.project_id || f.project_id === selectedProjectId;
    }
    return true;
  });

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending',
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const startUpload = async () => {
    if (queue.length === 0 || isUploading) return;

    setIsUploading(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      // Update state to uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 40 } : q))
      );

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        if (selectedProjectId) formData.append('project_id', selectedProjectId);
        if (selectedFolderId) formData.append('folder_id', selectedFolderId);

        const res = await uploadFileDirectAction(formData);

        if (res.error) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: 'error', errorMessage: res.error } : q
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: err?.message || 'Upload failed' }
              : q
          )
        );
      }
    }

    setIsUploading(false);
    router.refresh();
    onUploaded?.();
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const allCompleted = queue.length > 0 && queue.every((item) => item.status === 'completed');
  const hasStorageError = queue.some((item) =>
    item.errorMessage?.toLowerCase().includes('project-files')
  );

  const copyBucketSql = () => {
    navigator.clipboard.writeText(
      `INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false) ON CONFLICT (id) DO NOTHING;`
    );
    setCopiedMigration(true);
    setTimeout(() => setCopiedMigration(false), 2500);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(ext || '')) {
      return <FileImage className="w-4 h-4 text-purple-500" />;
    }
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'sql', 'html', 'css'].includes(ext || '')) {
      return <FileCode2 className="w-4 h-4 text-emerald-500" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-6 space-y-5 shadow-xl transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Upload Project Assets &amp; Documents
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct secure cloud storage with encrypted tenant isolation
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Missing Bucket Help Alert */}
      {hasStorageError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Supabase Storage Bucket Setup Required:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Your Supabase project needs the private bucket <code>project-files</code>. Open your <strong>Supabase Dashboard → SQL Editor</strong> and run:
          </p>
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px]">
            <span className="truncate">INSERT INTO storage.buckets (id, name, public) VALUES (&apos;project-files&apos;, &apos;project-files&apos;, false) ON CONFLICT (id) DO NOTHING;</span>
            <button
              onClick={copyBucketSql}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white shrink-0 cursor-pointer"
            >
              {copiedMigration ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedMigration ? 'Copied' : 'Copy SQL'}
            </button>
          </div>
        </div>
      )}

      {/* Target Project / Folder Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Assign to Project
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="">(No specific project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-800">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Folder Destination
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="">Root Directory</option>
              {availableFolders.map((f) => (
                <option key={f.id} value={f.id} className="dark:bg-slate-800">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/70 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Drag &amp; drop files here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            Supports documents, PDFs, code files, diagrams, and archives up to 50 MB each.
          </p>
        </div>
      </div>

      {/* Upload Queue List */}
      {queue.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Selected Files ({queue.length})</span>
            {allCompleted && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> All files uploaded successfully
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs border border-slate-200/80 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getFileIcon(item.file.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {item.file.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {item.status === 'uploading' && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {item.status === 'error' && (
                      <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium block truncate">
                        {item.errorMessage || 'Upload failed'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : item.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQueueItem(item.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setQueue([])}
              disabled={isUploading}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={startUpload}
              disabled={isUploading || allCompleted}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Start Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
