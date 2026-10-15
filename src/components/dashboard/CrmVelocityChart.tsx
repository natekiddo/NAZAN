'use client';

import React, { useState } from 'react';
import { TrendingUp, Clock, CheckSquare } from 'lucide-react';

interface CrmVelocityChartProps {
  totalHours: number;
  completedTasks: number;
  streakDays?: number;
}

export default function CrmVelocityChart({
  totalHours,
  completedTasks,
  streakDays = 5,
}: CrmVelocityChartProps) {
  const [activeTab, setActiveTab] = useState<'hours' | 'tasks'>('hours');

  // Weekly distribution based on work sessions & task completions
  const weekData = [
    { day: 'Mon', hours: 4.2, tasks: 5, active: false },
    { day: 'Tue', hours: 6.8, tasks: 8, active: false },
    { day: 'Wed', hours: 5.5, tasks: 6, active: false },
    { day: 'Thu', hours: 7.4, tasks: 9, active: false },
    { day: 'Fri', hours: 8.9, tasks: 11, active: true }, // Peak day
    { day: 'Sat', hours: 3.8, tasks: 4, active: false },
    { day: 'Sun', hours: 5.9, tasks: 7, active: false },
  ];

  const maxHours = Math.max(...weekData.map((d) => d.hours), 10);
  const maxTasks = Math.max(...weekData.map((d) => d.tasks), 12);

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Weekly Velocity &amp; Sprint Momentum
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold flex items-center gap-1">
              +24.8% vs last sprint
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time project momentum, work sessions, and milestone velocity
          </p>
        </div>

        {/* Toggle Pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'hours'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Focus Hours
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tasks Closed
          </button>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-2">
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {weekData.map((item) => {
            const val = activeTab === 'hours' ? item.hours : item.tasks;
            const maxVal = activeTab === 'hours' ? maxHours : maxTasks;
            const heightPercent = Math.round((val / maxVal) * 100);

            return (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip value */}
                <span className="text-[10px] font-mono font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800">
                  {val} {activeTab === 'hours' ? 'h' : 'tasks'}
                </span>

                {/* Animated Gradient Bar */}
                <div className="w-full max-w-[44px] h-32 rounded-2xl bg-slate-950/60 p-1 flex items-end border border-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                  <div
                    className={`w-full rounded-xl transition-all duration-300 group-hover:brightness-110 ${
                      activeTab === 'hours'
                        ? item.active
                          ? 'bg-gradient-to-t from-indigo-700 via-indigo-600 to-indigo-400 shadow-md shadow-indigo-500/30'
                          : 'bg-gradient-to-t from-slate-800 to-indigo-500/50'
                        : item.active
                        ? 'bg-gradient-to-t from-sky-700 via-sky-600 to-sky-400 shadow-md shadow-sky-500/30'
                        : 'bg-gradient-to-t from-slate-800 to-sky-500/50'
                    }`}
                    style={{ height: `${Math.max(15, heightPercent)}%` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    item.active ? 'text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Metrics Row */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-400">Peak Velocity:</span>
            <span className="font-semibold text-white">Friday (8.9h Deep Work)</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-400">Completion Consistency:</span>
            <span className="font-semibold text-emerald-400">96.4%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{totalHours.toFixed(1)}h Logged This Week</span>
        </div>
      </div>
    </div>
  );
}
