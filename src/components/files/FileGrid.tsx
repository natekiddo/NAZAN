'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  MoreVertical,
  FolderGit2,
  Calendar,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { FileItem, Folder } from '@/types';
import FileIcon from './FileIcon';
import { formatDate, formatFileSize } from '@/lib/utils';
import { getSignedFileUrl } from '@/lib/actions/files';
import FileActionModal from './FileActionModal';

interface FileGridProps {
  files: (FileItem & { project?: { name: string } | null })[];
  folders: Folder[];
  onFileUpdated?: () => void;
}

export default function FileGrid({ files, folders, onFileUpdated }: FileGridProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeActionFile, setActiveActionFile] = useState<FileItem | null>(null);

  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    const res = await getSignedFileUrl(file.id);
    setDownloadingId(null);

    if (res.signedUrl) {
      const link = document.createElement('a');
      link.href = res.signedUrl;
      link.download = res.originalName || file.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(res.error || 'Failed to download file');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between space-y-3 group"
          >
            {/* Top row: Icon & Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <FileIcon fileName={file.original_name} mimeType={file.mime_type} className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                  title="Download File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setActiveActionFile(file)}
                  title="File Actions"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle: File Name */}
            <div className="space-y-1">
              <h4
                title={file.original_name}
                className="font-bold text-xs text-slate-900 dark:text-white truncate"
              >
                {file.original_name}
              </h4>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{formatDate(file.created_at)}</span>
              </div>
            </div>

            {/* Bottom: Project Tag */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              {file.project?.name ? (
                <Link
                  href={`/projects/${file.project_id}`}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium hover:underline truncate max-w-[160px]"
                >
                  <FolderGit2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{file.project.name}</span>
                </Link>
              ) : (
                <span className="text-slate-400">General</span>
              )}

              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 font-medium">
                v1
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeActionFile && (
        <FileActionModal
          isOpen={true}
          onClose={() => setActiveActionFile(null)}
          file={activeActionFile}
          folders={folders}
          onUpdated={onFileUpdated}
        />
      )}
    </>
  );
}
