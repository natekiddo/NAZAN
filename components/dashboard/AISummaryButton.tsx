'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AIWorkSummaryModal from '@/components/ai/AIWorkSummaryModal';

export default function AISummaryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-4 py-2.5 text-sm font-semibold shadow-xs hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group"
      >
        <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
        <span>AI Summary</span>
      </button>

      <AIWorkSummaryModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
