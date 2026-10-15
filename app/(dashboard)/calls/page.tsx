import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces } from '@/lib/actions/workspaces';
import { getProjects } from '@/lib/actions/projects';
import { getWorkspaceActiveCalls } from '@/lib/actions/calls';
import VideoCallRoom from '@/components/calls/VideoCallRoom';

export default async function CallsPage() {
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

  const [projectsRes, activeCalls] = await Promise.all([
    getProjects(),
    getWorkspaceActiveCalls(currentWorkspace.id),
  ]);

  const currentUserData = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Voice &amp; Video Collaboration
        </h1>
        <p className="text-xs text-slate-500">
          Encrypted real-time video meetings, voice standups, and screen sharing for {currentWorkspace.name}.
        </p>
      </div>

      <VideoCallRoom
        workspace={currentWorkspace}
        projects={projectsRes.projects || []}
        activeCalls={activeCalls}
        currentUser={currentUserData}
      />
    </div>
  );
}
