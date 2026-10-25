import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MarketingHomepage from '@/components/marketing/MarketingHomepage';

export const metadata = {
  title: 'ProjectHub | Every project. Every person. Every next step.',
  description: 'Plan projects, track tasks, organize files, and keep your next step connected with ProjectHub.',
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');
  return <MarketingHomepage />;
}
