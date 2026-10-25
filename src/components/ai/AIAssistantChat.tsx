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
  HelpCircle,
  Lightbulb,
  Target,
  AlertTriangle,
  Code2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Project } from '@/types';
import { askAIAssistantAction } from '@/lib/actions/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantChatProps {
  projects: Project[];
  userName: string;
}

const QUICK_PROMPTS = [
  { label: '🎯 Daily Priorities', text: 'What are my top 3 priorities today based on my active tasks and projects?' },
  { label: '🏗️ Architecture Pattern', text: 'Recommend the best architecture pattern and data model for my active project.' },
  { label: '🔍 Debugging Checklist', text: 'Give me a systematic debugging protocol for solving full-stack Next.js and Supabase errors.' },
  { label: '📋 Sprint Breakdown', text: 'Help me break down my current project roadmap into actionable sprint tasks.' },
];

export default function AIAssistantChat({ projects, userName }: AIAssistantChatProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${userName}! 👋 I'm your **ProjectHub AI Assistant**, powered by **Gemini**.

I can help you think through your projects, tasks, stopping points, and work sessions.

How can I accelerate your development workflow today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const res = await askAIAssistantAction(query, selectedProjectId || null);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.answer || res.error || 'I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `### ⚠️ Assistant Note\n${err?.message || 'Failed to communicate with AI assistant.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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

  const handleClearChat = () => {
    if (confirm('Clear chat history?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Chat cleared! How can I help you today, ${userName}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto rounded-3xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border border-slate-200/90 dark:border-slate-800/90 shadow-xl overflow-hidden transition-colors">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-200/90 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-900/80 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-slate-900 dark:bg-saffron-400 dark:text-slate-900 text-saffron-400 shadow-sm">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 font-display">
              AI Assistant
              <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-brand-50 dark:bg-slate-800 text-brand-500 dark:text-saffron-400 border border-brand-100 dark:border-brand-700">
                Gemini
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A thoughtful copilot for your projects and day-to-day work
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
            <FolderGit2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[170px] truncate font-medium"
            >
              <option value="">All Projects Scope</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-800">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-slate-500 text-white font-bold text-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative max-w-2xl px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-500 text-white rounded-tr-xs shadow-md shadow-blue-600/15'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
                }`}
              >
                {/* Copy button for assistant */}
                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Content rendering */}
                <div className="whitespace-pre-wrap font-sans text-xs md:text-sm">
                  {msg.content}
                </div>

                <div
                  className={`mt-2.5 text-[10px] font-medium ${
                    isUser ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              <Bot className="w-4 h-4 text-slate-500 animate-bounce" />
            </div>
            <div className="px-5 py-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              <span>Analyzing workspace context &amp; generating Gemini response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1 uppercase tracking-wider">
          <Zap className="w-3 h-3 text-saffron-500" /> Prompts:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt.text)}
            disabled={loading}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-950">
        <div className="flex items-end gap-3 p-2 rounded-3xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus-within:border-slate-500 dark:focus-within:border-blue-400 transition-all">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedProjectId
                ? `Ask Gemini about this path, code roadmap, or tasks... (Enter to send)`
                : `Ask Gemini about architecture, code, roadmaps, or daily priorities... (Enter to send)`
            }
            rows={2}
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none resize-none px-3 py-1.5 max-h-32"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || loading}
            className="p-3 rounded-full bg-slate-500 hover:bg-slate-700 disabled:opacity-40 text-white font-medium shadow-md shadow-blue-600/25 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
