'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react';
import { ProjectNote, Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { createProjectNote, deleteProjectNote } from '@/lib/actions/notes';

interface ProjectNotesTabProps {
  project: Project;
  notes: ProjectNote[];
}

export default function ProjectNotesTab({ project, notes }: ProjectNotesTabProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await createProjectNote({
      project_id: project.id,
      title,
      content,
    });

    setTitle('');
    setContent('');
    setShowAddForm(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (note: ProjectNote) => {
    if (confirm(`Delete note "${note.title}"?`)) {
      await deleteProjectNote(note.id, project.id);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Project Notes &amp; Wiki
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Store research findings, architectural decisions, and references for Gemini AI to synthesize.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateNote}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs"
        >
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Create Note</h4>
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database schema design decisions"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">Content *</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes, Markdown supported..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-semibold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Note'}
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">No notes written yet</h4>
          <p className="text-xs text-slate-500">
            Write notes, documentation, and ideas that will later be accessible by Gemini AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {note.title}
                  </h4>
                  <button
                    onClick={() => handleDelete(note)}
                    className="p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                Created {formatDate(note.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
