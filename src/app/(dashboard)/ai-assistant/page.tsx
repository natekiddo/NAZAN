import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/actions/projects';
import { Project } from '@/types';
import AIAssistantChat from '@/components/ai/AIAssistantChat';

export default async function AIAssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let projects: Project[] = [];
  let userName = 'Developer';

  if (user) {
    userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Developer';

    const { projects: projList } = await getProjects();
    projects = (projList || []).filter((p) => p.status !== 'Archived');
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <AIAssistantChat projects={projects} userName={userName} />
    </div>
  );
}
