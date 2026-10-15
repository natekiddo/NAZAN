'use client';

import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Archive,
  Loader2,
  HardDrive,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { FileItem, Folder, Project } from '@/types';
import FileGrid from '@/components/files/FileGrid';
import FileDropzone from '@/components/files/FileDropzone';
import { getProjectFilesForDownload } from '@/lib/actions/files';
import { createProjectDriveFolderAction } from '@/lib/actions/drive';
import { useRouter } from 'next/navigation';

interface ProjectFilesTabProps {
  project: Project;
  files: FileItem[];
  folders: Folder[];
}

export default function ProjectFilesTab({
  project,
  files,
  folders,
}: ProjectFilesTabProps) {
  const router = useRouter();
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleDownloadZip = async () => {
    if (files.length === 0) return;

    setIsZipping(true);
    try {
      const res = await getProjectFilesForDownload(project.id);
      if (res.error || !res.files || res.files.length === 0) {
        alert(res.error || 'No downloadable files found');
        setIsZipping(false);
        return;
      }

      const zip = new JSZip();

      await Promise.all(
        res.files.map(async (file) => {
          if (!file.signedUrl) return;
          try {
            const response = await fetch(file.signedUrl);
            const blob = await response.blob();
            zip.file(file.name, blob);
          } catch (e) {
            console.error(`Failed to fetch file ${file.name} for zip`, e);
          }
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${project.name.replace(/\s+/g, '_')}_files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err?.message || 'Failed to download zip');
    } finally {
      setIsZipping(false);
    }
  };

  const handleCreateDriveFolder = async () => {
    setCreatingFolder(true);
    try {
      const res = await createProjectDriveFolderAction(project.id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to link Google Drive folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const driveFolderName = (project as any).drive_folder_name;
  const driveFolderId = (project as any).drive_folder_id;

  return (
    <div className="space-y-6">
      {/* Google Drive Project Folder Integration Bar */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Google Drive Cloud Folder:
              </span>
              {driveFolderName ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                  {driveFolderName}
                </span>
              ) : (
                <span className="text-slate-400">
                  Not linked to a dedicated Drive folder yet
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Files uploaded to this project automatically save to this designated Google Drive folder.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driveFolderId ? (
            <a
              href={`https://drive.google.com/drive/folders/${driveFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Drive
            </a>
          ) : (
            <button
              onClick={handleCreateDriveFolder}
              disabled={creatingFolder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {creatingFolder ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderPlus className="w-3.5 h-3.5" />
              )}
              Create Project Drive Folder
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Project Files &amp; Assets
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Source code snapshots, specifications, design assets, and research notes for {project.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {files.length > 0 && (
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isZipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              Download All as ZIP
            </button>
          )}

          <button
            onClick={() => setIsDropzoneOpen(!isDropzoneOpen)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {isDropzoneOpen ? 'Close Upload' : 'Upload Files'}
          </button>
        </div>
      </div>

      {isDropzoneOpen && (
        <FileDropzone
          projects={[project]}
          folders={folders}
          currentProjectId={project.id}
          onClose={() => setIsDropzoneOpen(false)}
          onUploaded={() => router.refresh()}
        />
      )}

      {files.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            No files attached to this project
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload architecture diagrams, requirements documents, test reports, or code files.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsDropzoneOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Project File
            </button>
          </div>
        </div>
      ) : (
        <FileGrid
          files={files.map((f) => ({ ...f, project: { name: project.name } }))}
          folders={folders}
          onFileUpdated={() => router.refresh()}
        />
      )}
    </div>
  );
}
