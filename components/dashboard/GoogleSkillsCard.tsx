'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  FolderGit2,
  HardDrive,
  Award,
  Layers,
} from 'lucide-react';

export interface GoogleSkillsCardProps {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status?: string;
  progress?: number;
  duration?: string;
  level?: 'Introductory' | 'Intermediate' | 'Advanced' | string;
  badgeType?: 'Skill badge' | 'Sprint' | 'Course' | 'Learning path' | string;
  linkHref: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  driveLinked?: boolean;
  stoppingPoint?: string | null;
}

export default function GoogleSkillsCard({
  id,
  title,
  description,
  category = 'Engineering',
  status = 'Active',
  progress = 0,
  duration = '2 weeks',
  level = 'Intermediate',
  badgeType = 'Skill badge',
  linkHref,
  accentColor = 'blue',
  driveLinked = false,
  stoppingPoint,
}: GoogleSkillsCardProps) {
  // Color themes inspired by Google Cloud Skills
  const colorMap = {
    blue: {
      tagBg: 'bg-blue-50 dark:bg-blue-950/60',
      tagText: 'text-blue-700 dark:text-blue-300',
      border: 'hover:border-blue-500/50',
      gradient: 'from-blue-600 via-indigo-600 to-blue-500',
      progress: 'bg-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    emerald: {
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      tagText: 'text-emerald-700 dark:text-emerald-300',
      border: 'hover:border-emerald-500/50',
      gradient: 'from-emerald-600 via-teal-600 to-emerald-500',
      progress: 'bg-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    amber: {
      tagBg: 'bg-amber-50 dark:bg-amber-950/60',
      tagText: 'text-amber-800 dark:text-amber-300',
      border: 'hover:border-amber-500/50',
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      progress: 'bg-amber-500',
      btn: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
    },
    purple: {
      tagBg: 'bg-purple-50 dark:bg-purple-950/60',
      tagText: 'text-purple-700 dark:text-purple-300',
      border: 'hover:border-purple-500/50',
      gradient: 'from-purple-600 via-pink-600 to-purple-500',
      progress: 'bg-purple-600',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    rose: {
      tagBg: 'bg-rose-50 dark:bg-rose-950/60',
      tagText: 'text-rose-700 dark:text-rose-300',
      border: 'hover:border-rose-500/50',
      gradient: 'from-rose-600 via-pink-600 to-rose-500',
      progress: 'bg-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
  };

  const theme = colorMap[accentColor] || colorMap.blue;

  return (
    <div
      className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/90 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${theme.border}`}
    >
      {/* Top Banner & Header Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          {/* Badge Pill (Google Skills style) */}
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${theme.tagBg} ${theme.tagText} border border-slate-200/60 dark:border-slate-800`}>
              <Award className="w-3 h-3" />
              <span>{badgeType}</span>
            </span>

            {driveLinked && (
              <span className="p-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px]" title="Google Drive Linked">
                <HardDrive className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Level / Duration Tag */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <Link href={linkHref} className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-google line-clamp-1">
              {title}
            </h3>
          </Link>
          <span className="text-xs font-semibold text-slate-400">
            {category} • Level: {level}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {description || 'Comprehensive software development project tracking features, task roadmap, and code milestones.'}
        </p>

        {/* Stopping Point / Next Action Callout (if present) */}
        {stoppingPoint && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mb-0.5">
              <span>👉 Next Action:</span>
            </span>
            <span className="line-clamp-1">{stoppingPoint}</span>
          </div>
        )}
      </div>

      {/* Footer: Progress & Google Action Button */}
      <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        {/* Progress Bar with Google Gradient */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Progress</span>
            <span className="text-slate-900 dark:text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-slate-400">
            Status: <strong className="text-slate-700 dark:text-slate-300">{status}</strong>
          </span>

          <Link
            href={linkHref}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${theme.btn}`}
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
