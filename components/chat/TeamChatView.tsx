'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Video,
  Hash,
  FolderGit2,
  Users,
  Smile,
  Code2,
  Paperclip,
  Loader2,
  Check,
  ShieldCheck,
  Crown,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import {
  Workspace,
  WorkspaceMember,
  Project,
  ChatMessageItem,
  Profile,
} from '@/types';
import { getWorkspaceChatMessages, sendChatMessageAction } from '@/lib/actions/chat';
import { createClient } from '@/lib/supabase/client';

interface TeamChatViewProps {
  workspace: Workspace;
  members: WorkspaceMember[];
  projects: Project[];
  currentUser: { id: string; name: string; email: string; avatarUrl?: string };
  initialMessages: ChatMessageItem[];
}

export default function TeamChatView({
  workspace,
  members,
  projects,
  currentUser,
  initialMessages,
}: TeamChatViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages whenever channel switches
  useEffect(() => {
    const fetchMessages = async () => {
      const res = await getWorkspaceChatMessages(workspace.id, selectedProjectId);
      if (res.messages) {
        setMessages(res.messages);
      }
    };
    fetchMessages();
  }, [workspace.id, selectedProjectId]);

  // Setup Realtime subscription
  useEffect(() => {
    const channelName = `workspace_chat_${workspace.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Only add if matches current channel
          if (
            (!selectedProjectId && !newMsg.project_id) ||
            (selectedProjectId && newMsg.project_id === selectedProjectId)
          ) {
            // Find sender profile from members
            const senderMember = members.find((m) => m.user_id === newMsg.user_id);
            const enrichedMessage: ChatMessageItem = {
              id: newMsg.id,
              workspace_id: newMsg.workspace_id,
              project_id: newMsg.project_id,
              user_id: newMsg.user_id,
              content: newMsg.content,
              attachments: newMsg.attachments,
              created_at: newMsg.created_at,
              updated_at: newMsg.updated_at,
              profile: senderMember?.profile || null,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === enrichedMessage.id)) return prev;
              return [...prev, enrichedMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace.id, selectedProjectId, members, supabase]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    setErrorMsg(null);

    // Optimistic message
    const tempId = 'temp_' + Date.now();
    const optimisticMessage: ChatMessageItem = {
      id: tempId,
      workspace_id: workspace.id,
      project_id: selectedProjectId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        id: currentUser.id,
        full_name: currentUser.name,
        email: currentUser.email,
        avatar_url: currentUser.avatarUrl || null,
      } as any,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue('');

    const res = await sendChatMessageAction(workspace.id, content, selectedProjectId);
    setSending(false);

    if (res.error) {
      setErrorMsg(res.error);
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (res.message) {
      // Replace optimistic message with actual
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.message! : m))
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentChannelName = selectedProjectId
    ? `# ${projects.find((p) => p.id === selectedProjectId)?.name || 'Project Channel'}`
    : '# general';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Channels & Members Sidebar */}
      <div className="w-full lg:w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
              {workspace.name}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Team Chat</span>
          </div>
          <Link
            href="/calls"
            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </Link>
        </div>

        {/* Channel Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          <div>
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Channels
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedProjectId(null)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                  selectedProjectId === null
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">general</span>
              </button>

              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors text-left cursor-pointer ${
                    selectedProjectId === proj.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{proj.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Teammates ({members.length})
              </span>
              <Link href="/workspace/members" className="text-[10px] text-indigo-500 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-1">
              {members.map((m) => {
                const name = m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';
                const isOwner = m.role === 'owner';
                const isAdmin = m.role === 'admin';

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {name[0]?.toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{name}</span>
                    </div>

                    {isOwner ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                        <Crown className="w-2.5 h-2.5" />
                        Owner
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[9px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* Channel Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                {currentChannelName}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {selectedProjectId
                ? `Real-time discussion for project ${projects.find((p) => p.id === selectedProjectId)?.name}`
                : 'Workspace-wide discussion for all team members'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/calls"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Start Meeting
            </Link>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                No messages yet in {currentChannelName}
              </p>
              <p className="text-xs">
                Say hello to your teammates or post a project update to start the discussion!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderName =
                msg.profile?.full_name ||
                msg.profile?.email?.split('@')[0] ||
                (msg.user_id === currentUser.id ? currentUser.name : 'Teammate');
              const isCurrentUser = msg.user_id === currentUser.id;

              return (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {senderName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {senderName}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-slate-400">(You)</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${currentChannelName} (Press Enter to send, Shift+Enter for new line)...`}
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none"
              />

              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] font-medium">
                    Markdown supported
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={sending || !inputValue.trim()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
