'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';

interface ResumeWorkButtonProps {
  projectId: string;
  projectName: string;
  className?: string;
  label?: string;
}

export default function ResumeWorkButton({
  projectId,
  projectName,
  className = 'flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer',
  label = 'Resume Work',
}: ResumeWorkButtonProps) {
  const { openStartDialog } = useSessionTimer();

  return (
    <button
      onClick={() => openStartDialog(projectId)}
      className={className}
      title={`Resume working on ${projectName}`}
    >
      <Play className="w-3.5 h-3.5 fill-white" />
      <span>{label}</span>
    </button>
  );
}
