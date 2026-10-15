'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Bot,
  HardDrive,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import StartSessionBannerButton from './StartSessionBannerButton';
import AISummaryButton from './AISummaryButton';

interface GoogleSkillsHeroProps {
  userName: string;
  onFilterChange?: (category: string) => void;
  onSearch?: (query: string) => void;
}

const PROMPT_SUGGESTIONS = [
  { label: 'AI Boost Bites', query: 'boost', icon: '✨' },
  { label: 'DeepMind & Gemini', query: 'gemini', icon: '🤖' },
  { label: 'Google Drive Sync', query: 'drive', icon: '☁️' },
  { label: 'Deep Work Sprint', query: 'sprint', icon: '⚡' },
  { label: 'Prompt Design', query: 'prompt', icon: '💡' },
];

const CATEGORIES = [
  'Featured',
  'Artificial Intelligence',
  'Active Sprints',
  'Google Cloud & Drive',
  'Prompt Design',
  'Task Roadmap',
];

export default function GoogleSkillsHero({
  userName,
  onFilterChange,
  onSearch,
}: GoogleSkillsHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Featured');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (onFilterChange) onFilterChange(cat);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Google Cloud Console Integration (Direct parity with skills.google) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-emerald-50/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-emerald-950/20 border border-blue-200/80 dark:border-blue-900/50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Apply your engineering skills in <strong className="text-blue-600 dark:text-blue-400">Google Cloud Console</strong> &amp; <strong className="text-purple-600 dark:text-purple-400">Gemini 3.8 Flash</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-xs transition-all hover:scale-[1.02]"
          >
            <span>Cloud Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Sync Drive</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Hero Body (skills.google Front Door Hero) */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-white dark:bg-[#0e1628] border border-slate-200/90 dark:border-slate-800/90 shadow-xl transition-all">
        {/* Subtle background ambient Google color gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-gradient-to-tr from-yellow-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          {/* Google 4-Color Micro Dot Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
              <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
              <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
              <span className="w-2 h-2 rounded-full bg-[#34A853]" />
            </span>
            <span>Google Skills &amp; Workspace Architecture • Powered by Gemini 3.8 Flash</span>
          </div>

          {/* Hero Display Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.15]">
            Build AI skills &amp; software for tomorrow, today
          </h1>

          {/* Hero Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Whether you&apos;re shipping full-stack apps or deepening your knowledge, future-proof your velocity with Google Cloud, Drive documents, and Gemini AI.
          </p>

          {/* Signature Google Pill Search Form */}
          <div className="pt-2 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to build or learn today?"
                  className="w-full pl-12 pr-28 py-3.5 rounded-full bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm border-2 border-slate-200 dark:border-slate-700/80 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none shadow-md shadow-slate-200/40 dark:shadow-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Hero Suggestion Chips (like skills.google prompt suggestions) */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Explore:
              </span>
              {PROMPT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => handleSuggestionClick(sug.query)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer shadow-2xs hover:scale-105"
                >
                  <span>{sug.icon}</span>
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hero CTA Actions */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <StartSessionBannerButton />
            <AISummaryButton />
          </div>
        </div>
      </div>

      {/* Categories Carousel / Filter Chips (skills.google ql-carousel) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-google">
              Skill up on <strong>AI &amp; Software</strong> today
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
              Google Certified
            </span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
            View All Catalog &rarr;
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-102 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
