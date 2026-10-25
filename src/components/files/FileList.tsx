'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  MoreVertical,
  FolderGit2,
  Calendar,
  Loader2,
} from 'lucide-react';
import { FileItem, Folder } from '@/types';
import FileIcon from './FileIcon';
import { formatDate, formatFileSize } from '@/lib/utils';
import { getSignedFileUrl } from '@/lib/actions/files';
import FileActionModal from './FileActionModal';

interface FileListProps {
  files: (FileItem & { project?: { name: string } | null })[];
  folders: Folder[];
  onFileUpdated?: () => void;
}

export default function FileList({ files, folders, onFileUpdated }: FileListProps) {
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5">Size</th>
                <th className="px-5 py-3.5">Uploaded</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <FileIcon fileName={file.original_name} mimeType={file.mime_type} className="w-5 h-5 shrink-0" />
                      <span className="truncate max-w-xs font-semibold">{file.original_name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                    {file.project?.name ? (
                      <Link
                        href={`/projects/${file.project_id}`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{file.project.name}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">General</span>
                    )}
                  </td>

                  <td className="px-5 py-3 font-mono text-slate-500">
                    {formatFileSize(file.file_size)}
                  </td>

                  <td className="px-5 py-3 text-slate-500">
                    {formatDate(file.created_at)}
                  </td>

                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        title="Download file"
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
                        title="Options"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
