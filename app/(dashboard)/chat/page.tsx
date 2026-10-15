import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces, getWorkspaceMembers } from '@/lib/actions/workspaces';
import { getProjects } from '@/lib/actions/projects';
import { getWorkspaceChatMessages } from '@/lib/actions/chat';
import TeamChatView from '@/components/chat/TeamChatView';

export default async function TeamChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { workspaces, activeWorkspaceId } = await getUserWorkspaces();
  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  if (!currentWorkspace) {
    redirect('/dashboard');
  }

  const [{ members }, projectsRes, chatRes] = await Promise.all([
    getWorkspaceMembers(currentWorkspace.id),
    getProjects(),
    getWorkspaceChatMessages(currentWorkspace.id),
  ]);

  const projects = projectsRes.projects || [];
  const initialMessages = chatRes.messages || [];

  const currentUserData = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatarUrl: user.user_metadata?.avatar_url,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <TeamChatView
        workspace={currentWorkspace}
        members={members}
        projects={projects}
        currentUser={currentUserData}
        initialMessages={initialMessages}
      />
    </div>
  );
}
