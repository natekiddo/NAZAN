import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Project } from '@/types';
import AIAssistantChat from '@/components/ai/AIAssistantChat';

export default async function AIAssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let projects: Project[] = [];
  let userName = 'Developer';

  if (user) {
    userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Developer';

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'Archived')
      .order('name', { ascending: true });

    projects = (data as unknown as Project[]) || [];
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <AIAssistantChat projects={projects} userName={userName} />
    </div>
  );
}
