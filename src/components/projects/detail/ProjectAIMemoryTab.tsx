'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  Loader2,
  Bot,
  FileText,
  Copy,
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Project, Task, WorkSession } from '@/types';
import { getProjectAIMemoryAction, askAIAssistantAction } from '@/lib/actions/ai';

interface ProjectAIMemoryTabProps {
  project: Project;
  sessions: WorkSession[];
  tasks: Task[];
}

export default function ProjectAIMemoryTab({
  project,
  sessions,
  tasks,
}: ProjectAIMemoryTabProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const latestSession = sessions[0] || null;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await getProjectAIMemoryAction(project.id);
      if (res.briefing) {
        setBriefing(res.briefing);
      }
    } catch (e) {
      console.warn('Failed to fetch project memory briefing:', e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [project.id]);

  const handleAskQuickQuestion = async (question: string) => {
    setChatInput(question);
    await handleSendQuestion(question);
  };

  const handleSendQuestion = async (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text || chatLoading) return;

    const userEntry = { role: 'user' as const, content: text };
    setChatHistory((prev) => [...prev, userEntry]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      const historyPayload = chatHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await askAIAssistantAction(text, project.id, historyPayload);
      const answer = res.answer || res.error || 'No response generated.';
      setChatHistory((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err?.message || 'Failed to query AI assistant'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyBriefing = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPrompts = [
    { label: '📍 Where did I stop working?', q: 'Where did I or my team stop working on this project? Detail the last session, work completed, and blockers.' },
    { label: '⏳ What tasks remain unfinished?', q: 'What tasks remain unfinished or overdue in this project? Prioritize them by urgency.' },
    { label: '👥 What did teammates complete?', q: 'What recent tasks and milestones were completed in this workspace project?' },
    { label: '🚀 What should I work on next?', q: 'Based on current task priorities, deadlines, and our last stopping point, what should I work on next?' },
    { label: '📝 Summarize meeting notes & decisions', q: 'Summarize recent technical notes, architecture decisions, and meeting takeaways recorded for this project.' },
    { label: '📊 Weekly progress report', q: 'Generate a comprehensive weekly progress report for this project with milestones, velocity, and risks.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-indigo-950/30 border border-indigo-500/20 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base">
              Project Memory &amp; Gemini Intelligence
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Contextual Memory Active
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Never lose your place. ProjectHub continuously remembers stopping points, team activity, unfinished tasks, and technical decisions without inventing project facts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBriefing}
            disabled={loadingBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBriefing ? 'animate-spin' : ''}`} />
            Refresh Memory
          </button>
          {briefing && (
            <button
              onClick={handleCopyBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Briefing'}
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Grid: Stopping Point (Ground Truth) vs Quick Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Ground Truth Stopping Point */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Last Stopping Point
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" />
              Database Truth
            </span>
          </div>

          {latestSession ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Last Session Recorded
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {latestSession.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(latestSession.start_time).toLocaleString()}</span>
                  <span>•</span>
                  <span>{latestSession.duration_mins} mins</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                    ✅ Work Accomplished:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {latestSession.work_completed || 'Focused development logged.'}
                  </p>
                </div>

                {latestSession.next_action && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                      👉 Resume Right Here:
                    </span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {latestSession.next_action}
                    </p>
                  </div>
                )}

                {latestSession.blockers && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Blocker Logged:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {latestSession.blockers}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{pendingTasks.length} tasks remaining</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Progress: {project.progress}%
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-xs text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                No stopping point recorded yet
              </p>
              <p className="text-[11px]">
                Start a deep work session from the top navigation to track your momentum and resume points.
              </p>
            </div>
          )}
        </div>

        {/* Column 2 & 3: AI Briefing & Quick Assistant */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Prompts Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Click Intelligent Assistant Queries
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuickQuestion(p.q)}
                  disabled={chatLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all hover:shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Briefing or Chat Thread */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 min-h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {chatHistory.length > 0 ? 'Project Memory Consultation' : 'Weekly Project Memory Briefing'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                Powered by Gemini 3.8 Flash
              </span>
            </div>

            {loadingBriefing ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Aggregating project sessions, notes, tasks, and team momentum...
                </p>
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col space-y-1 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-medium">
                      {msg.role === 'user' ? 'You' : 'ProjectHub AI'}
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs max-w-xl leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing project context...</span>
                  </div>
                )}
              </div>
            ) : briefing ? (
              <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {briefing}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Bot className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Click any quick prompt above to consult the AI assistant on this project.</p>
              </div>
            )}

            {/* Interactive Query Input */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
                placeholder="Ask Gemini anything about this project (e.g. 'What decisions were made about authentication?')"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSendQuestion()}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
