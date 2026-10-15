'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, RotateCw, Loader2, Bot } from 'lucide-react';
import { getAIWorkSummaryAction } from '@/lib/actions/ai';

interface AIWorkSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIWorkSummaryModal({ isOpen, onClose }: AIWorkSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    const res = await getAIWorkSummaryAction();
    if (res.summary) {
      setSummary(res.summary);
    } else {
      setSummary('Failed to generate summary.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !summary) {
      fetchSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gemini AI Developer Briefing
              </h2>
              <p className="text-xs text-indigo-200/80">
                AI synthesis of your projects, recent work sessions, and upcoming deadlines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {loading ? (
            <div className="p-12 text-center space-y-4">
              <div className="relative flex items-center justify-center w-12 h-12 mx-auto">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-30" />
                <Bot className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Gemini is analyzing your projects &amp; work sessions...
                </h4>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                  Synthesizing recent accomplishments, stopping points, and prioritizing what to tackle today.
                </p>
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              {summary}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Summary
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !summary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Briefing
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
