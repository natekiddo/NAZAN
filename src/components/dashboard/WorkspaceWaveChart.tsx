'use client';

import React, { useState } from 'react';

export default function WorkspaceWaveChart() {
  const [activeTab, setActiveTab] = useState<'3months' | '30days' | '7days'>('7days');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; value1: number; value2: number } | null>({
    x: 180,
    y: 135,
    date: 'Jun 23',
    value1: 530,
    value2: 480,
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] p-6 text-white shadow-xl">
      {/* Header with Title and Range Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
            Total Activity &amp; Focus
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Total metrics recorded across your team and projects
          </p>
        </div>

        {/* Filter Pills from screenshot */}
        <div className="inline-flex items-center rounded-xl bg-black/40 p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab('3months')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              activeTab === '3months' ? 'bg-[#242428] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Last 3 months
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('30days')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              activeTab === '30days' ? 'bg-[#242428] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('7days')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              activeTab === '7days' ? 'bg-[#27272c] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Last 7 days
          </button>
        </div>
      </div>

      {/* SVG Wave Chart matching screenshot */}
      <div className="relative mt-6 h-56 sm:h-64 w-full">
        {/* Floating Tooltip matching screenshot */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-20 rounded-xl border border-white/15 bg-black/85 px-3 py-2 text-xs shadow-2xl backdrop-blur-md transition-all duration-150"
            style={{
              left: `clamp(10px, ${hoveredPoint.x}px, calc(100% - 130px))`,
              top: `${Math.max(10, hoveredPoint.y - 85)}px`,
            }}
          >
            <p className="font-semibold text-zinc-300 text-[11px] mb-1">{hoveredPoint.date}</p>
            <div className="flex items-center gap-2 text-zinc-400 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>Tasks completed: <strong className="text-white">{hoveredPoint.value1}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>Minutes logged: <strong className="text-white">{hoveredPoint.value2}</strong></span>
            </div>
          </div>
        )}

        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 800 240"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Wave 1 gradient: bright silvery white to transparent */}
            <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#888888" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Wave 2 gradient: subtle gray to dark */}
            <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.18" />
              <stop offset="80%" stopColor="#52525b" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal grid lines */}
          <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1="180" x2="800" y2="180" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

          {/* Area 2 (secondary wave in background) */}
          <path
            d="M 0 170 Q 150 220 300 160 T 600 120 T 800 140 L 800 240 L 0 240 Z"
            fill="url(#waveGrad2)"
          />
          <path
            d="M 0 170 Q 150 220 300 160 T 600 120 T 800 140"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />

          {/* Area 1 (primary wave in foreground matching screenshot curve) */}
          <path
            d="M 0 130 C 120 180, 240 210, 420 110 C 580 30, 680 140, 800 120 L 800 240 L 0 240 Z"
            fill="url(#waveGrad1)"
          />
          <path
            d="M 0 130 C 120 180, 240 210, 420 110 C 580 30, 680 140, 800 120"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Interactive marker dot corresponding to tooltip */}
          <circle cx="180" cy="188" r="4.5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
          <circle cx="180" cy="148" r="4.5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
        </svg>

        {/* X-axis date labels matching screenshot */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono px-2">
          <span>Jun 24</span>
          <span>Jun 25</span>
          <span>Jun 26</span>
          <span>Jun 27</span>
          <span>Jun 28</span>
          <span>Jun 29</span>
        </div>
      </div>
    </div>
  );
}
