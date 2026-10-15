import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces, getWorkspaceMembers } from '@/lib/actions/workspaces';
import PricingView from '@/components/billing/PricingView';

interface PricingPageProps {
  searchParams: Promise<{ upgraded?: string }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { upgraded } = await searchParams;
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

  const { members } = await getWorkspaceMembers(currentWorkspace.id);
  const isOwner = currentWorkspace.owner_id === user.id;

  return (
    <PricingView
      workspace={currentWorkspace}
      members={members}
      isOwner={isOwner}
      isUpgradedNotice={upgraded === 'true'}
    />
  );
}
