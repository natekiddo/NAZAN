'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  UploadCloud,
  Search,
  Filter,
  Grid3X3,
  List as ListIcon,
  Download,
  Trash2,
  ChevronRight,
  HardDrive,
  FileCode2,
  FileImage,
  Archive,
  Layers,
  Loader2,
} from 'lucide-react';
import JSZip from 'jszip';
import { FileItem, Folder, Project } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { deleteFolder, getProjectFilesForDownload } from '@/lib/actions/files';
import FileGrid from './FileGrid';
import FileList from './FileList';
import FileDropzone from './FileDropzone';
import FolderModal from './FolderModal';
import { useRouter } from 'next/navigation';

interface FileManagerViewProps {
  initialFiles: (FileItem & { project?: { name: string } | null })[];
  folders: Folder[];
  projects: Project[];
}

export default function FileManagerView({
  initialFiles,
  folders,
  projects,
}: FileManagerViewProps) {
  const router = useRouter();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'code' | 'docs' | 'images' | 'archives'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Panels
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Storage Stats
  const totalBytes = useMemo(
    () => initialFiles.reduce((acc, f) => acc + (f.file_size || 0), 0),
    [initialFiles]
  );
  const totalProjectFiles = useMemo(
    () => initialFiles.filter((f) => f.project_id !== null).length,
    [initialFiles]
  );

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'All Files' }];
    if (currentFolderId) {
      const current = folders.find((f) => f.id === currentFolderId);
      if (current) {
        crumbs.push({ id: current.id, name: current.name });
      }
    }
    return crumbs;
  }, [currentFolderId, folders]);

  // Current subfolders
  const visibleFolders = useMemo(() => {
    return folders.filter((f) => {
      if (selectedProjectId !== 'all' && f.project_id && f.project_id !== selectedProjectId) {
        return false;
      }
      if (currentFolderId) {
        return f.parent_id === currentFolderId;
      }
      return !f.parent_id;
    });
  }, [folders, currentFolderId, selectedProjectId]);

  // Filtered Files
  const filteredFiles = useMemo(() => {
    return initialFiles.filter((file) => {
      // Folder filter
      if (currentFolderId) {
        if (file.folder_id !== currentFolderId) return false;
      }

      // Project filter
      if (selectedProjectId !== 'all' && file.project_id !== selectedProjectId) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = file.original_name.toLowerCase().includes(q);
        const matchProj = file.project?.name?.toLowerCase().includes(q) || false;
        if (!matchName && !matchProj) return false;
      }

      // Type filter
      if (fileTypeFilter !== 'all') {
        const ext = file.original_name.split('.').pop()?.toLowerCase() || '';
        const mime = file.mime_type || '';
        if (fileTypeFilter === 'code') {
          return ['ts', 'tsx', 'js', 'jsx', 'py', 'sql', 'json', 'html', 'css', 'go', 'rs', 'cpp'].includes(ext);
        }
        if (fileTypeFilter === 'docs') {
          return ['pdf', 'md', 'txt', 'doc', 'docx', 'csv', 'xlsx'].includes(ext) || mime.includes('pdf');
        }
        if (fileTypeFilter === 'images') {
          return ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext) || mime.startsWith('image/');
        }
        if (fileTypeFilter === 'archives') {
          return ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext) || mime.includes('zip');
        }
      }

      return true;
    });
  }, [initialFiles, currentFolderId, selectedProjectId, searchQuery, fileTypeFilter]);

  // Download project files as ZIP
  const handleDownloadProjectZip = async () => {
    if (selectedProjectId === 'all') {
      alert('Please select a specific project from the dropdown to download its files as a ZIP archive.');
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjectId);
    if (!targetProject) return;

    setIsZipping(true);
    try {
      const res = await getProjectFilesForDownload(targetProject.id);
      if (res.error || !res.files || res.files.length === 0) {
        alert(res.error || 'No files found for this project to download.');
        setIsZipping(false);
        return;
      }

      const zip = new JSZip();

      // Fetch each file blob and add to ZIP
      await Promise.all(
        res.files.map(async (file) => {
          if (!file.signedUrl) return;
          try {
            const response = await fetch(file.signedUrl);
            const blob = await response.blob();
            zip.file(file.name, blob);
          } catch (e) {
            console.error(`Failed to fetch file ${file.name} for zipping`, e);
          }
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${targetProject.name.replace(/\s+/g, '_')}_files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate ZIP archive');
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete folder "${folderName}"? Files inside will be moved to root.`)) {
      await deleteFolder(folderId);
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-500" />
            File Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store code snippets, documents, assets, and project files with private storage and versioning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedProjectId !== 'all' && (
            <button
              onClick={handleDownloadProjectZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Download Project ZIP
            </button>
          )}

          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            New Folder
          </button>

          <button
            onClick={() => setIsDropzoneOpen(!isDropzoneOpen)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {isDropzoneOpen ? 'Close Upload' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Files
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {initialFiles.length}
            </span>
            <span className="text-xs text-slate-500">items</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Storage Used
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatFileSize(totalBytes)}
            </span>
            <span className="text-xs text-slate-500">of 50 MB/file</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Project Files
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalProjectFiles}
            </span>
            <span className="text-xs text-slate-500">attached</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Folders
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500">
              {folders.length}
            </span>
            <span className="text-xs text-slate-500">folders</span>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Collapse */}
      {isDropzoneOpen && (
        <FileDropzone
          projects={projects}
          folders={folders}
          currentProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
          currentFolderId={currentFolderId}
          onClose={() => setIsDropzoneOpen(false)}
          onUploaded={() => router.refresh()}
        />
      )}

      {/* Breadcrumb Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto py-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:underline transition-colors shrink-0 ${
                    isLast
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* View Mode & Project Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name or project..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Files' },
              { id: 'code', label: 'Code' },
              { id: 'docs', label: 'Documents' },
              { id: 'images', label: 'Images' },
              { id: 'archives', label: 'Archives' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFileTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                fileTypeFilter === t.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Cards (if any visible) */}
      {visibleFolders.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Folders
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visibleFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {folder.name}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                  title="Delete Folder"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">
            {initialFiles.length === 0
              ? 'No files uploaded yet'
              : 'No files match your filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {initialFiles.length === 0
              ? 'Upload project source code, diagrams, research notes, and documentation.'
              : 'Try clearing search terms or selecting a different project filter.'}
          </p>
          {initialFiles.length === 0 && (
            <button
              onClick={() => setIsDropzoneOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload First File
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <FileGrid
          files={filteredFiles}
          folders={folders}
          onFileUpdated={() => router.refresh()}
        />
      ) : (
        <FileList
          files={filteredFiles}
          folders={folders}
          onFileUpdated={() => router.refresh()}
        />
      )}

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        projects={projects}
        currentProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        parentFolderId={currentFolderId}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
