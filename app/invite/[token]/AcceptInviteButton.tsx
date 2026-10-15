'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { acceptWorkspaceInvitation } from '@/lib/actions/workspaces';

export default function AcceptInviteButton({ token }: { token: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    const res = await acceptWorkspaceInvitation(token);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {error && (
        <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl text-left">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
      >
        <Check className="w-4 h-4" />
        <span>{isSubmitting ? 'Joining Workspace...' : 'Accept Invitation & Join Workspace'}</span>
      </button>
    </div>
  );
}
