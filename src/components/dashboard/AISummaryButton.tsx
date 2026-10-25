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
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-600 dark:hover:bg-slate-800 dark:hover:text-saffron-400"
      >
        <Sparkles className="w-4 h-4 text-brand-500 dark:text-saffron-400" />
        AI Summary
      </button>

      <AIWorkSummaryModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
