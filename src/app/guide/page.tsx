'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, BookOpen, Bot, CheckCircle2, ChevronRight, FileText, FolderKanban, Search, Users, X } from 'lucide-react';

const chapters = [
  { category: 'Getting started', icon: BookOpen, topics: [
    ['What is ProjectHub?', 'See how projects, tasks, files, work sessions, and project memory fit together.'],
    ['Getting started', 'Create a project, add your first tasks, and set a clear outcome.'],
    ['Individuals and teams', 'Use ProjectHub for personal work or coordinate shared projects.'],
  ]},
  { category: 'Projects & planning', icon: FolderKanban, topics: [
    ['Projects and tasks', 'Organize a goal into manageable work with ownership and status.'],
    ['Boards, lists, and timelines', 'Choose a view that makes the current work easier to understand.'],
    ['Work sessions and project memory', 'Record what is done, what is blocked, and the next step before you stop.'],
  ]},
  { category: 'AI & productivity', icon: Bot, topics: [
    ['Project AI assistant', 'Ask questions about project context and review suggestions before acting.'],
    ['Summaries and next steps', 'Use available project details to understand progress and possible priorities.'],
    ['Files and planning', 'Keep source documents close to the work they inform.'],
  ]},
  { category: 'Collaboration & account', icon: Users, topics: [
    ['Workspaces and invitations', 'Bring collaborators into a shared workspace and organize access.'],
    ['Files, history, and reminders', 'Keep important project updates and supporting resources visible.'],
    ['Plans, security, and FAQs', 'Find account guidance and answers to common questions.'],
  ]},
];

export default function GuidePage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => chapters.map((chapter) => ({
    ...chapter,
    topics: chapter.topics.filter(([title, description]) => `${chapter.category} ${title} ${description}`.toLowerCase().includes(query.toLowerCase())),
  })).filter((chapter) => chapter.topics.length), [query]);

  return (
    <main className="ph-guide">
      <header className="ph-guide-nav">
        <Link href="/" className="ph-guide-brand"><span className="ph-guide-mark">P</span> PROJECTHUB <span className="ph-guide-nav-divider" /> GUIDE</Link>
        <div><Link href="/" className="ph-guide-nav-link">Home</Link><Link href="/login" className="ph-guide-nav-link">Sign in</Link><Link href="/signup" className="ph-guide-nav-cta">Get started <ArrowRight size={14} /></Link></div>
      </header>
      <section className="ph-guide-hero">
        <div className="ph-guide-hero-copy">
          <p className="ph-guide-kicker"><span /> PROJECTHUB FIELD GUIDE</p>
          <h1>Make the next<br /><em>step obvious.</em></h1>
          <p className="ph-guide-intro">A practical guide to planning projects, keeping their context, and finding your way back to the work.</p>
          <a href="#chapters" className="ph-guide-start">Explore the guide <ArrowDownRight size={16} /></a>
        </div>
        <div className="ph-guide-hero-art" aria-label="Project journey from idea through a saved next step">
          <div className="ph-guide-art-orbit ph-orbit-a" /><div className="ph-guide-art-orbit ph-orbit-b" />
          <div className="ph-guide-art-center"><span>PROJECT<br />CONTEXT</span><b>↗</b></div>
          <span className="ph-guide-node ph-node-idea">01 <b>Idea</b></span><span className="ph-guide-node ph-node-plan">02 <b>Plan</b></span><span className="ph-guide-node ph-node-work">03 <b>Work</b></span><span className="ph-guide-node ph-node-memory">04 <b>Remember</b></span>
          <span className="ph-guide-art-caption">A project, carried forward.</span>
        </div>
      </section>
      <section className="ph-guide-searchbar" id="chapters">
        <div><span className="ph-guide-search-icon"><Search size={17} /></span><input aria-label="Search the guide" placeholder="Search projects, memory, AI…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}</div>
        <span>{filtered.reduce((total, group) => total + group.topics.length, 0)} ARTICLES</span>
      </section>
      <section className="ph-guide-content">
        <aside className="ph-guide-sidebar"><span>IN THIS GUIDE</span>{chapters.map((chapter) => <a key={chapter.category} href={`#${chapter.category.toLowerCase().replaceAll(' ', '-')}`}><chapter.icon size={15} />{chapter.category}<ChevronRight size={13} /></a>)}<div className="ph-guide-help"><span>Need a hand?</span><p>Start with the basics, then follow the path that fits your project.</p><Link href="/#faq">Visit FAQs <ArrowRight size={13} /></Link></div></aside>
        <div className="ph-guide-groups">
          {filtered.map((chapter, index) => <section className="ph-guide-group" id={chapter.category.toLowerCase().replaceAll(' ', '-')} key={chapter.category}>
            <div className="ph-guide-group-head"><span className="ph-guide-group-icon"><chapter.icon size={17} /></span><div><p>CHAPTER 0{index + 1}</p><h2>{chapter.category}</h2></div><span className="ph-guide-count">{String(chapter.topics.length).padStart(2, '0')} ARTICLES</span></div>
            <div className="ph-guide-articles">{chapter.topics.map(([title, description], i) => <article key={title}><span className="ph-guide-article-num">{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowRight size={16} /></article>)}</div>
          </section>)}
          {!filtered.length && <div className="ph-guide-empty"><Search size={22} /><h2>No guide articles found</h2><p>Try a different search term.</p></div>}
          <div className="ph-guide-note"><CheckCircle2 size={16} /><p>ProjectHub’s exact features depend on what is enabled in your workspace. AI suggestions are starting points for you to review.</p></div>
        </div>
      </section>
      <footer className="ph-guide-footer"><Link href="/" className="ph-guide-brand"><span className="ph-guide-mark">P</span> PROJECTHUB</Link><span>Keep the context. Continue with confidence.</span><Link href="/signup">Start your first project <ArrowRight size={13} /></Link></footer>
    </main>
  );
}