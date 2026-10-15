'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  FolderGit2,
  CheckSquare,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SearchResultItem {
  id: string;
  type: 'project' | 'task' | 'session' | 'file';
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'task' | 'session' | 'file'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = `%${query}%`;

      const searchResults: SearchResultItem[] = [];

      // Search Projects / Paths
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status, category')
        .ilike('name', q)
        .limit(5);

      const projects = (projectsData as any[]) || [];
      projects.forEach((p) => {
        searchResults.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: `Project • ${p.status} • ${p.category || 'Engineering'}`,
          href: `/projects/${p.id}`,
        });
      });

      // Search Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .ilike('title', q)
        .limit(5);

      const tasks = (tasksData as any[]) || [];
      tasks.forEach((t) => {
        searchResults.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `Task • ${t.status} • ${t.priority} Priority`,
          href: `/tasks?id=${t.id}`,
        });
      });

      // Search Work Sessions
      const { data: sessionsData } = await supabase
        .from('work_sessions')
        .select('id, title, work_completed')
        .ilike('title', q)
        .limit(4);

      const sessions = (sessionsData as any[]) || [];
      sessions.forEach((s) => {
        searchResults.push({
          id: s.id,
          type: 'session',
          title: s.title,
          subtitle: `Work Journal Session`,
          href: `/sessions`,
        });
      });

      // Search Files
      const { data: filesData } = await supabase
        .from('files')
        .select('id, original_name, project_id, project:projects(name)')
        .ilike('original_name', q)
        .eq('is_trashed', false)
        .limit(4);

      const files = (filesData as any[]) || [];
      files.forEach((f) => {
        searchResults.push({
          id: f.id,
          type: 'file',
          title: f.original_name,
          subtitle: f.project?.name ? `File in ${f.project.name}` : 'Workspace File',
          href: `/files`,
        });
      });

      setResults(searchResults);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const filteredResults =
    activeFilter === 'all' ? results : results.filter((r) => r.type === activeFilter);

  const getIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-[#1a73e8]" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#1e8e3e]" />;
      case 'session':
        return <Clock className="w-4 h-4 text-[#f9ab00]" />;
      case 'file':
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1220] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, work sessions, files..."
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs rounded-full bg-slate-100 dark:bg-slate-800 mr-2 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'project', label: 'Projects' },
            { id: 'task', label: 'Tasks' },
            { id: 'session', label: 'Work Sessions' },
            { id: 'file', label: 'Files' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-3">
          {loading ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500">
              <span className="inline-block animate-spin mr-2">⚙️</span>
              Searching your workspace...
            </div>
          ) : query && filteredResults.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No matching items found for &quot;{query}&quot;
            </div>
          ) : !query ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                Search across projects, tasks, work sessions, and files.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Try &quot;Next.js&quot;
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Try &quot;Gemini&quot;
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Try &quot;Sprint&quot;
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Keybinding Hints */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
          <span>Search your workspace</span>
          <div className="flex items-center gap-2">
            <span>ESC to close</span>
            <span>•</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
