'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Code2,
  FileText,
  ShieldAlert,
  ListTodo,
  Loader2,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { FileItem, FileAnalysisMode } from '@/types';
import { analyzeFileWithGeminiAction } from '@/lib/actions/ai';

interface FileGeminiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem;
}

export default function FileGeminiAnalysisModal({
  isOpen,
  onClose,
  file,
}: FileGeminiAnalysisModalProps) {
  const [mode, setMode] = useState<FileAnalysisMode>('explain');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async (selectedMode?: FileAnalysisMode) => {
    const activeMode = selectedMode || mode;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await analyzeFileWithGeminiAction(
        file.id,
        activeMode,
        customQuestion.trim() || undefined
      );

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.analysis) {
        setAnalysisResult(res.analysis);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to analyze file with Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modes: Array<{
    id: FileAnalysisMode;
    label: string;
    icon: React.ElementType;
    desc: string;
  }> = [
    {
      id: 'explain',
      label: 'Explain Code & Logic',
      icon: Code2,
      desc: 'Understand unfamiliar files & architecture in plain language',
    },
    {
      id: 'summarize',
      label: 'Summarize Document',
      icon: FileText,
      desc: 'Extract key takeaways, specs, and core takeaways',
    },
    {
      id: 'bugs',
      label: 'Bugs & Security Audit',
      icon: ShieldAlert,
      desc: 'Detect edge cases, errors, and performance improvements',
    },
    {
      id: 'tasks',
      label: 'Extract Sprint Tasks',
      icon: ListTodo,
      desc: 'Generate actionable backlog tasks from this document',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  Gemini File Intelligence: {file.original_name}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI deep code understanding &amp; document summarization with zero exposed API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    handleRunAnalysis(m.id);
                  }}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                    <Icon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{m.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Question Bar */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRunAnalysis();
                }
              }}
              placeholder="Or ask a specific question: e.g. 'What does function calculateRisk do?'"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleRunAnalysis()}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Analyze
            </button>
          </div>
        </div>

        {/* Analysis Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gemini 3.8 Flash is analyzing <span className="font-mono">{file.original_name}</span>...
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Extracting architecture, logic constructs, and insights securely without sending unnecessary private data.
              </p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Analysis Results
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {analysisResult}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <Bot className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Ready for AI File Inspection
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click one of the analysis modes above or type a question to get instant, deep technical insights on this file.
              </p>
              <button
                onClick={() => handleRunAnalysis('explain')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Explain This File
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>Source: {file.source === 'google_drive' ? 'Google Drive Cloud Asset' : 'Cloud Storage'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
