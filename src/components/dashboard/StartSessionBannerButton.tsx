'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';

export default function StartSessionBannerButton() {
  const { openStartDialog } = useSessionTimer();

  return (
    <button
      onClick={() => openStartDialog()}
      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 cursor-pointer"
    >
      <Play className="w-4 h-4 fill-white" />
      Start Work Session
    </button>
  );
}
