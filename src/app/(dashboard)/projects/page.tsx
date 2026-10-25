'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectTable from '@/components/projects/ProjectTable';
import ProjectFormModal from '@/components/projects/ProjectFormModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setProjects((data as unknown as Project[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  // Filter projects by search query and status
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="workspace-page space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">Build and organize</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white flex items-center gap-2">
            Projects
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A home for the things you&apos;re making and what comes next.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="workspace-primary-button self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Filter and View Bar */}
      <div className="workspace-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 !p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, description, category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Planning">Planning</option>
            <option value="Not Started">Not Started</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-brand-500 dark:text-saffron-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-brand-500 dark:text-saffron-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Presentation */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="workspace-empty space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-800 text-brand-500 dark:text-saffron-400 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              {searchQuery || statusFilter !== 'All' ? 'No matching projects found' : 'No projects yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'Try clearing your search filters to find what you are looking for.'
                : 'Create your first project to organize tasks, code repository links, and work journal.'}
            </p>
          </div>
          {!(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={handleOpenCreate}
              className="workspace-primary-button"
            >
              <Plus className="w-4 h-4" />
              Create project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={handleOpenEdit} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={filteredProjects} onEdit={handleOpenEdit} />
      )}

      {/* Create / Edit Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={editingProject}
      />
    </div>
  );
}
