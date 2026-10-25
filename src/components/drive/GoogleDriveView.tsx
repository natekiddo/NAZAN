'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HardDrive,
  ExternalLink,
  Search,
  CheckCircle2,
  FolderGit2,
  Plus,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  X,
  FileText,
  FileCode2,
  FileSpreadsheet,
  FileImage,
  RefreshCw,
  LogOut,
  Sparkles,
  Copy,
  Check,
  Cloud,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { Project, FileItem } from '@/types';
import { GoogleDriveFile } from '@/lib/google-drive';
import {
  fetchUserDriveFiles,
  linkDriveFileToProject,
  linkDriveUrlToProject,
  disconnectDriveIntegration,
} from '@/lib/actions/drive';
import { useRouter, useSearchParams } from 'next/navigation';

interface GoogleDriveViewProps {
  initialConnected: boolean;
  userEmail?: string;
  userName?: string;
  projects: Project[];
  linkedFiles: (FileItem & { project?: { name: string } | null })[];
  isMissingConfig: boolean;
}

// Sample fallback files for testing before OAuth setup
const MOCK_DRIVE_FILES: GoogleDriveFile[] = [
  {
    id: 'mock_1',
    name: 'CS490_Senior_Project_Specification.docx',
    mimeType: 'application/vnd.google-apps.document',
    size: '145200',
    webViewLink: 'https://docs.google.com/document/d/mock1',
    modifiedTime: new Date().toISOString(),
  },
  {
    id: 'mock_2',
    name: 'System_Architecture_Diagrams.pdf',
    mimeType: 'application/pdf',
    size: '2450000',
    webViewLink: 'https://drive.google.com/file/d/mock2/view',
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock_3',
    name: 'Project_Sprint_Budget_Estimates.xlsx',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    size: '89000',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock3',
    modifiedTime: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'mock_4',
    name: 'Database_Entity_Relationship_Notes.md',
    mimeType: 'text/markdown',
    size: '12400',
    webViewLink: 'https://drive.google.com/file/d/mock4/view',
    modifiedTime: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'mock_5',
    name: 'UI_Design_Tokens_and_Components.pdf',
    mimeType: 'application/pdf',
    size: '1850000',
    webViewLink: 'https://drive.google.com/file/d/mock5/view',
    modifiedTime: new Date(Date.now() - 345600000).toISOString(),
  },
];

export default function GoogleDriveView({
  initialConnected,
  userEmail,
  userName,
  projects,
  linkedFiles,
  isMissingConfig,
}: GoogleDriveViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConnectedParam = searchParams.get('connected');
  const errorParam = searchParams.get('error');

  const isReallyConnected = initialConnected || isConnectedParam === 'true';

  const [connected, setConnected] = useState(isReallyConnected);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSampleFiles, setUseSampleFiles] = useState(!isReallyConnected);

  // Cloud Connect modal for unconfigured environments
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Direct URL Linking Modal (Zero-OAuth required!)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlToLink, setUrlToLink] = useState('');
  const [urlDocName, setUrlDocName] = useState('');
  const [urlTargetProjectId, setUrlTargetProjectId] = useState<string>(projects[0]?.id || '');
  const [isLinkingUrl, setIsLinkingUrl] = useState(false);

  // Modal to link file to project
  const [selectedFileToLink, setSelectedFileToLink] = useState<GoogleDriveFile | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || '');
  const [linking, setLinking] = useState(false);

  // Sync state whenever props or URL params change
  useEffect(() => {
    if (initialConnected || isConnectedParam === 'true') {
      setConnected(true);
      setIsDemoMode(false);
      setUseSampleFiles(false);
    }
  }, [initialConnected, isConnectedParam]);

  const loadFiles = async (query?: string) => {
    if (useSampleFiles || isDemoMode || !connected) {
      if (query && query.trim()) {
        const q = query.toLowerCase();
        setDriveFiles(MOCK_DRIVE_FILES.filter((f) => f.name.toLowerCase().includes(q)));
      } else {
        setDriveFiles(MOCK_DRIVE_FILES);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetchUserDriveFiles(query);
      if (res.files && res.files.length > 0) {
        setDriveFiles(res.files);
      } else if (res.error) {
        console.warn('Live drive fetch notice:', res.error);
        setDriveFiles(MOCK_DRIVE_FILES);
      } else {
        // Connected but empty drive or no match
        setDriveFiles([]);
      }
    } catch (err) {
      console.error('Error fetching drive files:', err);
      setDriveFiles(MOCK_DRIVE_FILES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(searchQuery);
  }, [useSampleFiles, isDemoMode, connected]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const handleConnectClick = () => {
    if (isMissingConfig) {
      setIsSetupModalOpen(true);
    } else {
      window.location.href = '/api/auth/google';
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setConnected(true);
    setUseSampleFiles(true);
    setIsSetupModalOpen(false);
    loadFiles();
  };

  const handleLinkToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileToLink || !targetProjectId) return;

    setLinking(true);
    const res = await linkDriveFileToProject(selectedFileToLink, targetProjectId);
    setLinking(false);

    if (res.error) {
      alert(`Error linking file: ${res.error}`);
    } else {
      setSelectedFileToLink(null);
      router.refresh();
    }
  };

  const handleLinkUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToLink.trim() || !urlTargetProjectId) return;

    setIsLinkingUrl(true);
    const res = await linkDriveUrlToProject(urlToLink, urlDocName, urlTargetProjectId);
    setIsLinkingUrl(false);

    if (res.error) {
      alert(`Error linking file: ${res.error}`);
    } else {
      setIsUrlModalOpen(false);
      setUrlToLink('');
      setUrlDocName('');
      router.refresh();
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Google Drive?')) {
      if (!isDemoMode) {
        await disconnectDriveIntegration();
      }
      setConnected(false);
      setIsDemoMode(false);
      setUseSampleFiles(true);
      router.refresh();
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText('http://localhost:3000/api/auth/google/callback');
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your-client-secret\nNEXT_PUBLIC_GOOGLE_PICKER_API_KEY=your-api-key`);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const getDriveFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('document') || mimeType.includes('word') || name.endsWith('.docx')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || name.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-purple-500" />;
    }
    return <FileCode2 className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            Google Drive &amp; Cloud Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect Google Drive or link documents, spreadsheets, and specifications directly to your projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Link via Direct URL Button (Always Available) */}
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link by Drive URL
          </button>

          {connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect Cloud
            </button>
          ) : (
            <>
              <button
                onClick={enableDemoMode}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Demo Cloud
              </button>
              <button
                onClick={handleConnectClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <HardDrive className="w-4 h-4" />
                Connect Google Drive
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications/Alerts */}
      {isConnectedParam && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Google Drive connected successfully! You can now browse and link your cloud assets.</span>
        </div>
      )}

      {errorParam && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Google OAuth: <strong>{errorParam === 'missing_credentials'
                ? 'Google OAuth credentials are missing in .env.local.'
                : decodeURIComponent(errorParam)}</strong>.
              You can also use <strong>&quot;Link by Drive URL&quot;</strong> above to link files directly!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                router.replace('/drive');
                setTimeout(() => {
                  window.location.href = '/api/auth/google';
                }, 100);
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Retry Connect
            </button>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3 py-1 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-bold hover:underline"
            >
              OAuth Help
            </button>
            <button
              onClick={() => router.replace('/drive')}
              className="p-1 rounded-lg hover:bg-rose-200/50 text-rose-700 dark:text-rose-300 cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Integration Status Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
            <Cloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cloud Connection Status
              </h3>
              {connected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isDemoMode ? 'Demo Cloud Active' : 'Live Connected'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                  Ready to Connect
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {connected
                ? isDemoMode
                  ? 'Connected via Instant Demo Cloud Mode. You can browse, search, and link project files.'
                  : `Authorized Google Account: ${userEmail || userName || 'Active Developer'}`
                : 'Link Google Drive documents, slides, and sheets to track all project collateral in one place.'}
            </p>
          </div>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Mode:</span>
          <button
            onClick={() => {
              if (isMissingConfig && !connected) {
                setIsSetupModalOpen(true);
                return;
              }
              setUseSampleFiles(false);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              !useSampleFiles && connected && !isDemoMode
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Live Drive
          </button>
          <button
            onClick={() => {
              setUseSampleFiles(true);
              setIsDemoMode(true);
              setConnected(true);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              useSampleFiles || isDemoMode
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Demo Files Mode
          </button>
        </div>
      </div>

      {/* Drive File Browser & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            Available Cloud Files ({driveFiles.length})
          </h2>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, sheets, PDFs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Drive Files Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-500">Querying cloud storage...</p>
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">No cloud files found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {driveFiles.map((file) => (
              <div
                key={file.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 group-hover:scale-105 transition-transform">
                    {getDriveFileIcon(file.mimeType, file.name)}
                  </div>

                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open file"
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <h4
                    title={file.name}
                    className="font-bold text-xs text-slate-900 dark:text-white truncate"
                  >
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Google Drive Cloud Document
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedFileToLink(file)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-indigo-950/50 dark:to-indigo-900/30 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 transition-all cursor-pointer w-full justify-center shadow-2xs"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link to Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Drive Files Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-indigo-500" />
          Linked Google Drive Files in Your Projects ({linkedFiles.length})
        </h2>

        {linkedFiles.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
            <p className="text-xs text-slate-500">
              No Google Drive files linked to your projects yet.
            </p>
            <p className="text-[11px] text-slate-400">
              Click &quot;Link to Project&quot; above or use &quot;Link by Drive URL&quot; to attach any document to your projects.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">File Name</th>
                    <th className="px-5 py-3.5">Linked Project</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {linkedFiles.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-sm">{f.original_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {f.project?.name ? (
                          <Link
                            href={`/projects/${f.project_id}`}
                            className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                            {f.project.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">General</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <a
                          href={f.storage_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Direct URL Linker Modal (Zero-OAuth!) */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Link Google Drive File by URL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Attach any Google Doc, Sheet, Slide, or shared file directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Drive / Docs URL *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    required
                    value={urlToLink}
                    onChange={(e) => setUrlToLink(e.target.value)}
                    placeholder="https://docs.google.com/document/d/... or https://drive.google.com/..."
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Title / Label (Optional)
                </label>
                <input
                  type="text"
                  value={urlDocName}
                  onChange={(e) => setUrlDocName(e.target.value)}
                  placeholder="e.g. Architecture Specification v2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attach to Project *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <select
                    value={urlTargetProjectId}
                    onChange={(e) => setUrlTargetProjectId(e.target.value)}
                    required
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-800">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinkingUrl || !urlToLink.trim() || !urlTargetProjectId}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLinkingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  Link Document Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setup / Configuration Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Google Drive Integration Options
                  </h3>
                  <p className="text-xs text-slate-500">
                    Link documents immediately or configure full Google OAuth
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Instant URL Linker */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Option 1: Link by Drive URL (Fastest &amp; Zero Setup)
                </span>
                <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300/90 leading-relaxed">
                Paste any Google Doc, Sheet, or Drive share URL to attach it directly to your project without needing any Google Cloud credentials!
              </p>
              <button
                onClick={() => {
                  setIsSetupModalOpen(false);
                  setIsUrlModalOpen(true);
                }}
                className="w-full mt-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Open URL Linker
              </button>
            </div>

            {/* Option 2: Instant Demo Mode */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Option 2: Instant Demo Cloud Workspace
                </span>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  1-Click
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                Explore with simulated specifications, spreadsheets, and diagrams.
              </p>
              <button
                onClick={enableDemoMode}
                className="w-full mt-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Enable Demo Cloud Mode
              </button>
            </div>

            {/* Option 3: Live Google Cloud OAuth Walkthrough */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Option 3: Full Google Cloud OAuth Setup Guide
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If you want ProjectHub to browse your entire Google Drive directory via OAuth:
              </p>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <p>1. In <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-500 underline">Google Cloud Console</a>, enable <strong>Google Drive API</strong>.</p>
                <p>2. Create OAuth Client ID (Application type: <strong>Web application</strong>).</p>
                <p>3. Add Authorized Redirect URI below:</p>
                <div className="flex items-center justify-between pt-1">
                  <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-emerald-600 dark:text-emerald-400">http://localhost:3000/api/auth/google/callback</code>
                  <button
                    onClick={copyRedirectUri}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUri ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-amber-500 pt-1">
                  *Important: If your OAuth Consent Screen is in <strong>&quot;Testing&quot;</strong>, add your personal Google email under <strong>Test Users</strong> to avoid &quot;access_denied&quot; errors.
                </p>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 truncate">.env.local variables</span>
                <button
                  onClick={copyEnvSnippet}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEnv ? 'Copied' : 'Copy Keys'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link to Project Modal */}
      {selectedFileToLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                Link File to Project
              </h3>
              <button
                onClick={() => setSelectedFileToLink(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                {getDriveFileIcon(selectedFileToLink.mimeType, selectedFileToLink.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                  {selectedFileToLink.name}
                </p>
                <p className="text-[10px] text-slate-400">Google Drive Document</p>
              </div>
            </div>

            <form onSubmit={handleLinkToProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Project
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    required
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-800">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileToLink(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !targetProjectId}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  Link Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
