'use client';

import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Trash2, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { useSessionTimer } from '@/context/SessionTimerContext';

export default function ActiveSessionBar() {
  const {
    activeSession,
    elapsedSeconds,
    pauseTimer,
    resumeTimer,
    stopAndRecord,
    discardTimer,
  } = useSessionTimer();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeSession) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeSession.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                activeSession.isPaused ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>

          <span className="text-xs font-mono font-bold tracking-wider">{formattedTime}</span>
          <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">
            {activeSession.projectName}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-indigo-500/30 p-4 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-3.5">
        {/* Left: Indicator & Session Info */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="relative flex h-3 w-3 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeSession.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                activeSession.isPaused ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300 truncate max-w-[180px]">
                {activeSession.projectName}
              </span>
              {activeSession.isPaused && (
                <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 rounded font-medium">
                  Paused
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {activeSession.taskTitle ? `Task: ${activeSession.taskTitle}` : activeSession.title}
            </p>
          </div>
        </div>

        {/* Center: Digital Timer Clock */}
        <div className="flex items-center gap-2 font-mono font-bold text-xl sm:text-2xl text-white tracking-widest bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>{formattedTime}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {activeSession.isPaused ? (
            <button
              onClick={resumeTimer}
              title="Resume Timer"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              title="Pause Timer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-amber-300" />
            </button>
          )}

          <button
            onClick={stopAndRecord}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Finish &amp; Record</span>
            <span className="sm:hidden">Finish</span>
          </button>

          <button
            onClick={discardTimer}
            title="Discard Session"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
