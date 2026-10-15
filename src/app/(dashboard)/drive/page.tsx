import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Project, FileItem } from '@/types';
import { getDriveIntegrationStatus } from '@/lib/actions/drive';
import { getProjects } from '@/lib/actions/projects';
import { hasGoogleOAuthCredentials } from '@/lib/google-drive';
import GoogleDriveView from '@/components/drive/GoogleDriveView';

export default async function GoogleDrivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let projects: Project[] = [];
  let linkedFiles: (FileItem & { project?: { name: string } | null })[] = [];
  let integrationStatus = { connected: false, email: undefined, name: undefined };

  // 1. Check Drive integration status from cookie first (unconditional & instant)
  try {
    const statusRes = await getDriveIntegrationStatus();
    integrationStatus = statusRes as any;
  } catch (e) {
    console.warn('Error reading drive status:', e);
  }

  // 2. Fetch projects and linked files if user is authenticated
  if (user) {
    const [projRes, filesRes] = await Promise.all([
      getProjects(),
      supabase
        .from('files')
        .select('*, project:projects(name)')
        .eq('user_id', user.id)
        .eq('source', 'google_drive')
        .eq('is_trashed', false)
        .order('created_at', { ascending: false }),
    ]);

    projects = (projRes.projects || []).filter((p) => p.status !== 'Archived');
    linkedFiles = (filesRes.data as unknown as (FileItem & { project?: { name: string } | null })[]) || [];
  }

  const isMissingConfig = !hasGoogleOAuthCredentials();

  return (
    <GoogleDriveView
      initialConnected={integrationStatus.connected}
      userEmail={integrationStatus.email}
      userName={integrationStatus.name}
      projects={projects}
      linkedFiles={linkedFiles}
      isMissingConfig={isMissingConfig}
    />
  );
}
