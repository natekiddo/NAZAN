'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';

export default function StartSessionBannerButton() {
  const { openStartDialog } = useSessionTimer();

  return (
    <button
      onClick={() => openStartDialog()}
      className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-900 cursor-pointer dark:bg-saffron-400 dark:text-slate-900 dark:hover:bg-saffron-400"
    >
      <Play className="w-4 h-4 fill-white" />
      Start Work Session
    </button>
  );
}
