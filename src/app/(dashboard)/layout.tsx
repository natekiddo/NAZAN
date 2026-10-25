'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';
import GlobalSearchModal from '@/components/layout/GlobalSearchModal';
import QuickCreateModal from '@/components/layout/QuickCreateModal';
import { SessionTimerProvider } from '@/context/SessionTimerContext';
import ActiveSessionBar from '@/components/sessions/ActiveSessionBar';
import SessionModal from '@/components/sessions/SessionModal';
import StartSessionDialog from '@/components/sessions/StartSessionDialog';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || null);
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
        setUserName(fullName || 'Developer');
        setAvatarUrl(user.user_metadata?.avatar_url || null);

        // Fetch unread notifications count
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadCount(count || 0);
      }
    }

    fetchUserData();
  }, []);

  return (
    <SessionTimerProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar
            userEmail={userEmail}
            userName={userName}
            avatarUrl={avatarUrl}
            unreadCount={unreadCount}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
          />

          <main className="app-canvas flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Modals & Session Controls */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        <QuickCreateModal
          isOpen={isQuickCreateOpen}
          onClose={() => setIsQuickCreateOpen(false)}
        />

        <StartSessionDialog />
        <SessionModal />
        <ActiveSessionBar />
      </div>
    </SessionTimerProvider>
  );
}
