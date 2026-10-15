'use server';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initializeChapaCheckout } from '@/lib/payments/chapa';
import { getEffectivePermissions } from '@/lib/permissions';

export async function upgradeWorkspacePlanAction(
  workspaceId: string,
  provider: 'chapa' | 'test' = 'chapa',
  returnUrl?: string
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: User not authenticated' };
  }

  const db = createAdminClient() || supabase;

  // Verify user is workspace owner or has can_manage_billing
  const { data: member } = await db
    .from('workspace_members')
    .select('role, custom_permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return { success: false, error: 'Access denied: You are not a member of this workspace' };
  }

  const effective = getEffectivePermissions(member.role, member.custom_permissions);
  if (!effective.can_manage_billing) {
    return {
      success: false,
      error: 'Permission denied: Only the workspace owner can manage billing and subscriptions',
    };
  }

  // If using Chapa checkout
  const txRef = `tx_hub_${Date.now()}_${workspaceId.slice(0, 8)}`;
  const userName = user.user_metadata?.full_name || 'ProjectHub User';
  const [firstName, ...rest] = userName.split(' ');
  const lastName = rest.join(' ') || 'Subscriber';

  const chapaRes = await initializeChapaCheckout({
    amount: 1500, // 1,500 ETB
    currency: 'ETB',
    email: user.email || 'user@projecthub.local',
    firstName,
    lastName,
    txRef,
    returnUrl: returnUrl || `http://localhost:3000/pricing?upgraded=true`,
  });

  if (chapaRes.error) {
    return { success: false, error: chapaRes.error };
  }

  // Update workspace in database to 'team' plan
  const { error: updateErr } = await db
    .from('workspaces')
    .update({
      plan: 'team',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', workspaceId);

  if (updateErr) {
    // If table column not available, continue gracefully
    console.warn('Workspace plan update note:', updateErr.message);
  }

  // Log audit log
  await db.from('workspace_audit_logs').insert({
    workspace_id: workspaceId,
    actor_id: user.id,
    action: 'upgraded_plan_to_team',
    details: {
      provider,
      plan: 'team',
      amount_etb: 1500,
      timestamp: new Date().toISOString(),
    },
  } as any);

  revalidatePath('/pricing');
  revalidatePath('/workspace/members');
  revalidatePath('/dashboard');

  return {
    success: true,
    checkoutUrl: chapaRes.checkoutUrl,
  };
}

export async function downgradeWorkspacePlanAction(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const db = createAdminClient() || supabase;
  const { data: member } = await db
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (member?.role !== 'owner') {
    return { success: false, error: 'Only the workspace owner can manage billing' };
  }

  await db
    .from('workspaces')
    .update({ plan: 'free', updated_at: new Date().toISOString() } as any)
    .eq('id', workspaceId);

  revalidatePath('/pricing');
  revalidatePath('/workspace/members');
  return { success: true };
}
