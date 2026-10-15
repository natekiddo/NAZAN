'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Clock,
  FolderGit2,
  CheckSquare,
  FileCode,
  AlertTriangle,
  Lightbulb,
  Target,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Save,
} from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';
import { createClient } from '@/lib/supabase/client';
import { createWorkSession, updateWorkSession } from '@/lib/actions/sessions';
import { Project, Task } from '@/types';

export default function SessionModal() {
  const { isLogModalOpen, closeLogModal, modalPrefill, discardTimer } = useSessionTimer();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>('');
  const [workCompleted, setWorkCompleted] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [blockers, setBlockers] = useState<string>('');
  const [decisionsMade, setDecisionsMade] = useState<string>('');
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [filesWorkedOn, setFilesWorkedOn] = useState<string[]>([]);
  const [fileInput, setFileInput] = useState<string>('');

  // Fetch projects when modal opens
  useEffect(() => {
    if (!isLogModalOpen) return;

    async function loadProjects() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'Archived')
          .order('name');

        const projs = (data as unknown as Project[]) || [];
        setProjects(projs);
      }
    }

    loadProjects();
  }, [isLogModalOpen]);

  // Initialize or prefill state
  useEffect(() => {
    if (!isLogModalOpen) return;

    if (modalPrefill) {
      setProjectId(modalPrefill.projectId || '');
      setTaskId(modalPrefill.taskId || '');
      setTitle(modalPrefill.title || '');
      setDurationMins(modalPrefill.durationMins || 30);
      setStartDate(
        modalPrefill.startTime
          ? new Date(modalPrefill.startTime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
      setWorkCompleted(modalPrefill.workCompleted || '');
      setNextAction(modalPrefill.nextAction || '');
      setBlockers(modalPrefill.blockers || modalPrefill.problemsEncountered || '');
      setDecisionsMade(modalPrefill.decisionsMade || '');
      setPersonalNotes(modalPrefill.personalNotes || '');
      setFilesWorkedOn(modalPrefill.filesWorkedOn || []);
    } else {
      // Default new manual log
      setTitle('Development session');
      setDurationMins(45);
      setStartDate(new Date().toISOString().slice(0, 16));
      setWorkCompleted('');
      setNextAction('');
      setBlockers('');
      setDecisionsMade('');
      setPersonalNotes('');
      setFilesWorkedOn([]);
    }
    setErrorMsg(null);
  }, [isLogModalOpen, modalPrefill]);

  // Load tasks when project selection changes
  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    async function loadTasks() {
      const supabase = createClient();
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'Completed')
        .order('title');

      setTasks((data as unknown as Task[]) || []);
    }

    loadTasks();
  }, [projectId]);

  if (!isLogModalOpen) return null;

  const handleAddFile = () => {
    const trimmed = fileInput.trim();
    if (trimmed && !filesWorkedOn.includes(trimmed)) {
      setFilesWorkedOn([...filesWorkedOn, trimmed]);
      setFileInput('');
    }
  };

  const handleRemoveFile = (fileToRemove: string) => {
    setFilesWorkedOn(filesWorkedOn.filter((f) => f !== fileToRemove));
  };

  const handleAddDuration = (mins: number) => {
    setDurationMins((prev) => Math.max(5, prev + mins));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorMsg('Please select a project for this work session.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const startTimeIso = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const endTimeIso = new Date(new Date(startTimeIso).getTime() + durationMins * 60000).toISOString();

    try {
      if (modalPrefill?.isEditing && modalPrefill.id) {
        // Update existing session
        const res = await updateWorkSession(modalPrefill.id, {
          project_id: projectId,
          task_id: taskId || null,
          title: title.trim() || 'Work Session',
          start_time: startTimeIso,
          end_time: endTimeIso,
          duration_mins: durationMins,
          work_completed: workCompleted.trim() || null,
          files_worked_on: filesWorkedOn,
          problems_encountered: blockers.trim() || null,
          decisions_made: decisionsMade.trim() || null,
          blockers: blockers.trim() || null,
          next_action: nextAction.trim() || null,
          personal_notes: personalNotes.trim() || null,
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }
      } else {
        // Create new session
        const res = await createWorkSession({
          project_id: projectId,
          task_id: taskId || null,
          title: title.trim() || 'Work Session',
          start_time: startTimeIso,
          end_time: endTimeIso,
          duration_mins: durationMins,
          work_completed: workCompleted.trim() || null,
          files_worked_on: filesWorkedOn,
          problems_encountered: blockers.trim() || null,
          decisions_made: decisionsMade.trim() || null,
          blockers: blockers.trim() || null,
          next_action: nextAction.trim() || null,
          personal_notes: personalNotes.trim() || null,
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        // If this was recording from an active timer, discard/clear the active timer from state
        discardTimer();
      }

      closeLogModal();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(modalPrefill?.isEditing);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Work Session' : 'Record Work Session & Stopping Point'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Capture what was done, where you stopped, and your immediate next step.
              </p>
            </div>
          </div>
          <button
            onClick={closeLogModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Project & Task Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTaskId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose a project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                Related Task (Optional)
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- No specific task --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implemented auth & middleware"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Duration (Minutes)</span>
                <span className="text-[11px] text-indigo-500 font-mono">
                  {Math.floor(durationMins / 60)}h {durationMins % 60}m
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  required
                  value={durationMins}
                  onChange={(e) => setDurationMins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                {[15, 30, 60].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => handleAddDuration(add)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-medium transition-colors"
                  >
                    +{add}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Work Completed (Accomplishments) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              What did you accomplish during this session?
            </label>
            <textarea
              rows={3}
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="e.g. Completed Supabase Auth middleware, protected routes, and user session persistence. Cleaned up build errors."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Next Action (Crucial for "Continue where I stopped") */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
            <label className="block font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Next Action (Immediate step when you resume)
            </label>
            <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
              This will automatically update your project's next action and appear directly on your dashboard.
            </p>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Build the work sessions journal view and live timer widget"
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Blockers & Decisions in 2-col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Problems / Blockers Encountered (Optional)
              </label>
              <textarea
                rows={2}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. Next.js Turbopack path resolution warnings, SSL certificate error during npm install"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Decisions Made (Optional)
              </label>
              <textarea
                rows={2}
                value={decisionsMade}
                onChange={(e) => setDecisionsMade(e.target.value)}
                placeholder="e.g. Used @google/genai SDK instead of older community wrappers; configured server actions for session logging"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Files Worked On (Tag input) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              Files or Components Worked On
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileInput}
                onChange={(e) => setFileInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFile();
                  }
                }}
                placeholder="e.g. src/auth/middleware.ts or ProjectCard.tsx (Press enter)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFile}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors"
              >
                Add
              </button>
            </div>

            {filesWorkedOn.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filesWorkedOn.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Personal Notes / Reflection (Optional)
            </label>
            <textarea
              rows={2}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="e.g. Need to review Vercel deployment variables next time"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={closeLogModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !projectId}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Save Changes' : 'Record & Save Stopping Point'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
