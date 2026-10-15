'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  FolderGit2,
  Trash2,
  Copy,
  Check,
  Loader2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  RotateCcw,
  Download,
  Flame,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { Project } from '@/types';
import { askAIAssistantAction } from '@/lib/actions/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  messages: ChatMessage[];
}

interface AIAssistantChatProps {
  projects: Project[];
  userName: string;
}

const QUICK_PROMPTS = [
  { label: '🎯 Daily Priorities', text: 'Analyze my projects and tasks. What are my top 3 priorities today to maximize sprint velocity?' },
  { label: '🏗️ Architecture Pattern', text: 'Recommend the best scalable architecture pattern and data model for full-stack Next.js and Supabase.' },
  { label: '🔍 Debugging Protocol', text: 'Give me a systematic debugging protocol for solving full-stack Next.js and Supabase errors.' },
  { label: '📋 Sprint Breakdown', text: 'Help me break down my current project roadmap into actionable sprint tasks and milestones.' },
];

const STORAGE_KEY = 'projecthub_ai_threads_v3';

export default function AIAssistantChat({ projects, userName }: AIAssistantChatProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load threads from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatThread[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          if (parsed[0].projectId) setSelectedProjectId(parsed[0].projectId);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat threads:', e);
    }

    // Default initial thread if none exist
    const defaultThread: ChatThread = {
      id: crypto.randomUUID(),
      title: 'Sprint Planning & Architecture',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello ${userName}! 👋 I'm your **ProjectHub AI Senior Engineering Partner**, powered by **Gemini 3.8 Flash**.

I have continuous contextual awareness of your workspace projects, milestones, tasks, and Google Drive files.

* Full multi-turn conversation memory is active.
* All chats and history are automatically preserved.

What technical challenge or feature sprint are we crushing today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setThreads([defaultThread]);
    setActiveThreadId(defaultThread.id);
  }, [userName]);

  // 2. Persist threads to localStorage whenever updated
  useEffect(() => {
    if (threads.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
      } catch (e) {
        console.warn('Failed to save threads to localStorage:', e);
      }
    }
  }, [threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, loading]);

  // Create New Thread
  const handleCreateNewThread = () => {
    const newThread: ChatThread = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: selectedProjectId || undefined,
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Ready for a new session, ${userName}! Ask me anything about your code, database, tasks, or system design.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  // Delete Thread
  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      // If only 1 thread left, reset it
      handleCreateNewThread();
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      return;
    }

    const filtered = threads.filter((t) => t.id !== threadId);
    setThreads(filtered);
    if (activeThreadId === threadId) {
      setActiveThreadId(filtered[0]?.id || '');
    }
  };

  // Send Message with True Conversational Memory
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading || !activeThread) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const isFirstUserMessage =
      activeThread.messages.filter((m) => m.role === 'user').length === 0;

    const updatedTitle =
      isFirstUserMessage && activeThread.title === 'New Conversation'
        ? query.slice(0, 36) + (query.length > 36 ? '...' : '')
        : activeThread.title;

    const updatedMessages = [...activeThread.messages, userMessage];

    // Optimistically update thread in state
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : t
      )
    );

    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      // Pass previous chat history for multi-turn reasoning
      const historyPayload = activeThread.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await askAIAssistantAction(
        query,
        selectedProjectId || null,
        historyPayload
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.answer || res.error || 'I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...t.messages, assistantMessage],
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `### ⚠️ Notice\n${err?.message || 'Failed to communicate with AI model. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...t.messages, errorMessage] }
            : t
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Transcript
  const handleExportTranscript = () => {
    if (!activeThread) return;
    const transcript = activeThread.messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n\n---\n`)
      .join('\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeThread.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] max-w-7xl mx-auto rounded-3xl bg-[#090D16]/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden transition-colors">
      {/* 1. Left Chat History Drawer / Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0 -ml-72 md:w-16 md:ml-0'
        } shrink-0 bg-[#060911]/95 border-r border-white/5 flex flex-col transition-all duration-300 z-10`}
      >
        {/* Header / New Chat Button */}
        <div className="p-3.5 border-b border-white/5 flex items-center justify-between gap-2">
          {sidebarOpen ? (
            <button
              onClick={handleCreateNewThread}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          ) : (
            <button
              onClick={handleCreateNewThread}
              className="p-2.5 rounded-2xl bg-indigo-600 text-white font-bold mx-auto cursor-pointer shadow-md shadow-indigo-500/20"
              title="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={sidebarOpen ? 'Collapse history' : 'Expand history'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Saved Thread Sessions List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {sidebarOpen && (
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span>Chat History ({threads.length})</span>
              <span className="text-indigo-400 font-medium">Auto-Saved</span>
            </div>
          )}

          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`group flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-white border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={thread.title}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  {sidebarOpen && (
                    <div className="truncate">
                      <p className="truncate text-xs font-semibold">{thread.title}</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {thread.messages.length} messages
                      </p>
                    </div>
                  )}
                </div>

                {sidebarOpen && (
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-all ml-1 cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Tier Indicator */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/5 text-[11px] text-slate-400 bg-black/20">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Gemini 3.8 Flash
              </span>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Connected
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* 2. Main Chat Conversation Workstation */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19]/80">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-white/5 bg-[#090D16]/60 backdrop-blur-md gap-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white font-bold shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#0B0F19]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white tracking-tight font-display">
                  {activeThread?.title || 'Gemini 3.8 Flash Engineering Partner'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  Multi-Turn Memory Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous contextual awareness of your code, tasks &amp; Google Drive assets
              </p>
            </div>
          </div>

          {/* Project Scope & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs shadow-2xs">
              <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate text-xs font-semibold"
              >
                <option value="" className="bg-[#0B0F19]">All Projects Scope</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0B0F19]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportTranscript}
              className="p-2 rounded-full text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer"
              title="Download Transcript (.md)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Bubble History Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeThread?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-indigo-500/25'
                      : 'bg-slate-900 text-cyan-400 border border-white/10'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative max-w-3xl px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-lg shadow-indigo-600/20'
                      : 'bg-[#111827]/90 border border-white/10 text-slate-100 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <div className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed">
                    {msg.content}
                  </div>

                  <div
                    className={`mt-2.5 text-[10px] font-medium ${
                      isUser ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 border border-white/10">
                <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
              </div>
              <div className="px-5 py-3.5 rounded-3xl bg-[#111827]/90 border border-white/10 text-xs text-slate-300 flex items-center gap-2.5 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Gemini 3.8 Flash is generating response with workspace context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2.5 border-t border-white/5 bg-[#090D16]/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1 uppercase tracking-wider">
            <Flame className="w-3 h-3 text-amber-400" /> Quick Ask:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt.text)}
              disabled={loading}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-600/15 hover:text-indigo-200 text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#060911]/90">
          <div className="flex items-end gap-3 p-2 rounded-3xl bg-slate-900/90 border border-white/10 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedProjectId
                  ? `Ask Gemini about this project, its code, roadmaps, or debug an error... (Enter to send)`
                  : `Ask Gemini about architecture, code, tasks, or system design... (Enter to send)`
              }
              rows={2}
              className="flex-1 bg-transparent text-slate-100 text-xs md:text-sm placeholder:text-slate-500 focus:outline-none resize-none px-3 py-1.5 max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || loading}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
