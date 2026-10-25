'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  Bell, Clock3, FileText, FolderKanban, LayoutGrid, Moon, Paperclip, Search, Sparkles, Sun, Users,
} from 'lucide-react';
import BrandMark from '@/components/brand/BrandMark';
import ProductDashboardDemo from '@/components/marketing/ProductDashboardDemo';
import { AssistantDemo, ProjectMemoryDemo } from '@/components/marketing/DemoStorytelling';
import { useTheme } from '@/context/ThemeContext';

/* ===================  MYDNA-STYLE SCENES  =================== */
const N = 44;

/* Rotating particle double helix, drawn by mutating SVG attributes (no re-renders). */
function Helix() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const dots = svg.querySelectorAll<SVGCircleElement>('circle');
    const rungs = svg.querySelectorAll<SVGLineElement>('line');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const draw = (t: number) => {
      const p = still ? 0 : t / 1700;
      for (let i = 0; i < N; i++) {
        const y = 10 + i * 11.5;
        const lean = 150 + i * 2.2;
        const a = i * 0.43 + p;
        const xa = lean + Math.sin(a) * 74;
        const xb = lean - Math.sin(a) * 74;
        const da = Math.cos(a);
        const set = (el: SVGCircleElement, x: number, d: number) => {
          el.setAttribute('cx', x.toFixed(1));
          el.setAttribute('cy', y.toFixed(1));
          el.setAttribute('r', (3.4 + d * 1.9).toFixed(2));
          el.setAttribute('opacity', (0.5 + ((d + 1) / 2) * 0.5).toFixed(2));
        };
        set(dots[i], xa, da);
        set(dots[N + i], xb, -da);
        const r = rungs[i];
        r.setAttribute('x1', xa.toFixed(1)); r.setAttribute('x2', xb.toFixed(1));
        r.setAttribute('y1', y.toFixed(1)); r.setAttribute('y2', y.toFixed(1));
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  const fill = (i: number) => `hsl(${268 + 52 * Math.sin((i / N) * 3.2)} 78% ${62 + (i % 5)}%)`;
  return (
    <svg ref={ref} className="mh-helix" viewBox="0 0 300 520" aria-hidden="true">
      {Array.from({ length: N }, (_, i) => <line key={`l${i}`} stroke={fill(i)} strokeOpacity=".28" />)}
      {Array.from({ length: N * 2 }, (_, i) => <circle key={i} fill={fill(i % N)} />)}
    </svg>
  );
}

export function MydnaHero() {
  return (
    <section className="mh-hero" data-reveal>
      <div className="mh-stage">
        <Helix />
        <div className="mh-copy">
          <p className="mh-eyebrow">PURPOSE OF PROJECTHUB</p>
          <h1>Pick up every project where you left off</h1>
          <p className="mh-sub">Plans, tasks, work sessions and files in one place, so you always know what is done, where you stopped and what comes next.</p>
          <Link href="/signup" className="mh-pill">Get started free</Link>
        </div>
        <a href="#features" className="mh-scroll"><ArrowDown size={12} /> Scroll for more</a>
        <article className="mh-card">
          <b>01</b>
          <div><small>Project memory</small><h3>Resume where you stopped</h3></div>
          <p>Record what you finished, what blocked you and the next step. When you come back, ProjectHub shows it first, so there is nothing to piece together.</p>
        </article>
      </div>
    </section>
  );
}

function Count({ to }: { to: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}</span>;
}

const stats: [number, string][] = [[4, 'Project views: board, list, timeline, calendar'], [5, 'Core ideas in one workspace'], [2, 'Free members, owner included'], [1, 'Suggested next step']];

export function MydnaMission() {
  return (
    <section className="mh-mission" data-reveal>
      <div className="mh-mission-topline">
        <span>PROJECTHUB / PURPOSE</span>
        <span>01 — CONTINUITY</span>
      </div>
      <div className="mh-mission-grid">
        <div className="mh-mission-content">
          <h2 className="mh-statement" aria-label="Our mission is to remember where your work stopped, what you finished, what still needs attention, and the clearest next step.">
            <span className="mh-statement-lead">Our mission is to</span>
            <em className="mh-statement-word">Remember</em>
            <span className="mh-statement-line">where your work stopped—</span>
            <span className="mh-statement-line">what you finished, what still needs attention,</span>
            <span className="mh-statement-line">and the clearest next step, ready when you return.</span>
          </h2>
          <dl className="mh-stats">
            {stats.map(([n, label], i) => (
              <div className="mh-stat" key={label}>
                <dt><Count to={n} /></dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="mh-mission-foot"><span>NOTHING LOST BETWEEN SESSIONS</span><span>ONE CLEAR NEXT MOVE ↗</span></div>
    </section>
  );
}

const links = [['Product', '#features'], ['Planning', '#planning'], ['Memory', '#memory'], ['Files', '#files'], ['Team', '#teams'], ['Pricing', '#pricing'], ['Guide', '/guide'], ['FAQ', '#faq']];

/* Violet dot that trails the pointer and swells over links and buttons. */
export function MydnaCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      ref.current?.classList.toggle('is-big', !!(e.target as HTMLElement).closest('a,button,[role=tab],input,textarea'));
    };
    const loop = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      if (ref.current) ref.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener('pointermove', move); raf = requestAnimationFrame(loop);
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="mm-cursor" aria-hidden="true" />;
}

export function MydnaHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.current?.style.setProperty('--sp', String(max > 0 ? y / max : 0));
      setHidden(y > last && y > 160);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, []);

  return (
    <>
      <header className={`mm mm-head ${hidden && !open ? 'is-hidden' : ''} ${open ? 'is-open' : ''}`}>
        <Link href="/" className="mm-logo">PROJECTHUB</Link>
        <button type="button" className="mm-menu-btn" aria-expanded={open} aria-controls="mm-overlay" onClick={() => setOpen(!open)}>
          <span className="mm-lines"><i /><i /></span>{open ? 'Close' : 'Menu'}
        </button>
        <div className="mm-nav-actions">
          <Link href="/login" className="mm-signin-link">Log in</Link>
          <div className="mm-icons">
            <button type="button" className="mm-ico" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</button>
            <a href="#faq" className="mm-ico" aria-label="Search the FAQ"><Search size={14} /></a>
          </div>
        </div>
        <div ref={bar} className="mm-progress" aria-hidden="true" />
      </header>
      <nav id="mm-overlay" className={`mm mm-overlay ${open ? 'is-open' : ''}`} aria-label="Site menu" aria-hidden={!open}>
        {links.map(([label, href], i) => (
          <a key={label} href={href} tabIndex={open ? 0 : -1} style={{ '--d': i } as CSSProperties} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <Link href="/signup" tabIndex={open ? 0 : -1} className="mm-overlay-cta" style={{ '--d': links.length } as CSSProperties} onClick={() => setOpen(false)}>Get started free</Link>
      </nav>
      <MydnaCursor />
    </>
  );
}

export const cv = (o: Record<string, string | number>) => o as CSSProperties;

export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/* Writes --p (0..1) onto the element as it travels through the viewport. */
export function useScrollVar(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--p', Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.2))).toFixed(3));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [ref]);
}

/* Infinite marquee whose speed swells with scroll velocity and reverses per row. */
function Row({ words, dir }: { words: string[]; dir: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let x = 0, last = scrollY, v = 0, raf = 0;
    const tick = () => {
      v += ((scrollY - last) - v) * 0.1; last = scrollY;
      x -= dir * (0.7 + Math.abs(v) * 0.4);
      const el = ref.current;
      if (el) {
        const w = el.scrollWidth / 2;
        if (x <= -w) x += w; if (x > 0) x -= w;
        el.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dir]);
  const set = [...words, ...words];
  return <div className="ms-marq"><div ref={ref} className="ms-marq-track" aria-hidden="true">{[0, 1].map((k) => <div className="ms-marq-set" key={k}>{set.map((w, i) => <span key={i} className={i % 2 ? 'v' : ''}>{w}<b>/</b></span>)}</div>)}</div></div>;
}

export function MydnaMarquee() {
  return <section className="mm" aria-label="Plan the work, keep the context, move forward"><Row dir={1} words={['Remember where you stopped', 'Know what comes next', 'Plan the work']} /><Row dir={-1} words={['Projects', 'Tasks', 'Work sessions', 'Files', 'Next step']} /></section>;
}

const fan = [
  ['Project memory', 'Resume from the real next step.'],
  ['AI, reviewed by you', 'Useful suggestions stay yours to approve.'],
  ['Files beside the work', 'Keep project documents in context.'],
];

const featureStories = [
  { label: 'PROJECT PLANNING', title: 'Give the work a destination.', body: 'Set the project goal, status, and deadline before the details start moving.', link: 'See project planning', href: '#planning', art: 'plan' },
  { label: 'TASKS THAT MOVE', title: 'Make the next action obvious.', body: 'Break a project into tasks and priorities, then move work across Board, List, and Timeline.', link: 'Explore the workspace', href: '#views', art: 'tasks' },
  { label: 'WORK SESSIONS', title: 'Close the loop before you leave.', body: 'Capture what you finished, what got in the way, and where to begin next time.', link: 'See work sessions', href: '#planning', art: 'sessions' },
  { label: 'PROJECT MEMORY', title: 'Come back without starting over.', body: 'Keep the stopping point and next step with the project, ready when you return.', link: 'Explore project memory', href: '#memory', art: 'memory' },
  { label: 'AI + PROJECT FILES', title: 'Keep help and source close.', body: 'Review Gemini suggestions and keep linked files beside the work they support.', link: 'See AI and files', href: '#ai', art: 'context' },
];

export function MydnaFan() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const move = (direction: -1 | 1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>('.ms-story-card');
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
  };
  const updateActive = () => {
    const el = track.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.ms-story-card'));
    const nearest = cards.reduce((best, card, i) => {
      const x = card.getBoundingClientRect().left - el.getBoundingClientRect().left;
      const currentBest = cards[best].getBoundingClientRect().left - el.getBoundingClientRect().left;
      return Math.abs(x) < Math.abs(currentBest) ? i : best;
    }, 0);
    setActive(nearest);
  };
  return (
    <section className="mm ms-story-section" aria-labelledby="story-heading">
      <header className="ms-story-header">
        <div>
          <p className="ms-fan-kicker">A workspace that moves with you</p>
          <h2 id="story-heading">Five ways to keep<br /><em>the work moving.</em></h2>
        </div>
        <div className="ms-story-controls">
          <span>{String(active + 1).padStart(2, '0')} <i>/</i> 05</span>
          <button type="button" onClick={() => move(-1)} aria-label="Previous feature"><ChevronLeft size={17} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next feature"><ChevronRight size={17} /></button>
        </div>
      </header>
      <div ref={track} className="ms-story-track" role="region" aria-label="Five ProjectHub feature stories" tabIndex={0} onScroll={updateActive}>
        {featureStories.map((story, i) => (
          <article className={`ms-story-card ms-story-card-${story.art}`} key={story.art} aria-label={`Feature ${i + 1} of 5: ${story.label}`}>
            <div className={`ms-story-art ms-story-art-${story.art}`} aria-hidden="true">
              {story.art === 'plan' && <div className="ms-art-plan"><span>PROJECT / 014</span><b>Spring launch</b><i /><small>Goal · Public release</small><small>Due · May 28</small></div>}
              {story.art === 'tasks' && <div className="ms-art-board"><div><small>TO DO</small><i /><i /><i /></div><div><small>IN PROGRESS</small><i /><i /></div><div><small>DONE</small><i /><i /></div></div>}
              {story.art === 'sessions' && <div className="ms-art-session"><small>FOCUS SESSION</small><b>42<span>m</span></b><i><u /></i><div><span>DONE <strong>03</strong></span><span>NEXT <strong>01</strong></span></div></div>}
              {story.art === 'memory' && <div className="ms-art-memory"><div className="ms-art-memory-orbit"><span /><span /><b>↗</b></div><small>LAST SESSION · 4:42 PM</small><strong>Authentication</strong><p>Next · Fix the reset email</p></div>}
              {story.art === 'context' && <div className="ms-art-context"><div><Sparkles size={16} /><b>Gemini draft</b><small>3 tasks for review</small></div><div><FileText size={16} /><b>Auth flow notes</b><small>Linked to project</small></div><span>YOUR PROJECT CONTEXT</span></div>}
            </div>
            <div className="ms-story-copy">
              <span className="ms-story-label"><i>0{i + 1}</i> / {story.label}</span>
              <span className="ms-story-quote" aria-hidden="true">“</span>
              <h3>{story.title}</h3>
              <p>{story.body}</p>
              <a href={story.href}>{story.link} <ArrowUpRight size={15} /></a>
            </div>
          </article>
        ))}
      </div>
      <div className="ms-story-progress" aria-hidden="true"><i style={{ transform: `scaleX(${(active + 1) / featureStories.length})` }} /></div>
      <p className="ms-story-hint">SCROLL OR SWIPE TO EXPLORE <ArrowRight size={12} /></p>
    </section>
  );
}

const steps = [
  'Create the project with its goal, status and deadline.',
  'Break it into tasks and subtasks with priorities.',
  'Work, then record the session: done, problems, next.',
  'Attach the files and notes the work depends on.',
  'Ask Gemini to summarize or draft tasks, and review them.',
  'Return later and resume from the saved stopping point.',
];

export function MydnaScience() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const [a, setA] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (!seen || hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setA((n) => (n + 1) % steps.length), 3200);
    return () => clearInterval(t);
  }, [seen, hold]);
  const go = (d: number) => setA((n) => (n + d + steps.length) % steps.length);
  return (
    <section ref={ref} className={`mm ms-sci ${seen ? 'is-in' : ''}`} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="ms-sci-head">
        <h2><span>How a project</span><span>picks back up</span></h2>
        <div>
          <p className="ms-sci-copy">Record where you stop. Come back to <em>a clear next step.</em></p>
          <div className="ms-arrows"><button type="button" aria-label="Previous step" onClick={() => go(-1)}><ChevronLeft size={15} /></button><button type="button" aria-label="Next step" onClick={() => go(1)}><ChevronRight size={15} /></button></div>
        </div>
      </div>
      <div className="ms-sci-track" style={cv({ '--a': a })} role="tablist" aria-label="How work moves">
        <span className="ms-sci-fill" />
        {steps.map((s, i) => (
          <button type="button" role="tab" aria-selected={a === i} key={s} className={`ms-node ${a === i ? 'is-on' : ''}`} onClick={() => setA(i)}>
            <i /><p>{s}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

const adv = [
  ['01', 'Connected workspace', 'Projects, tasks, notes, files and sessions live together, not in separate tools.'],
  ['02', 'Project memory', 'Record what you finished, what blocked you and the next step, then resume with context.'],
  ['03', 'AI you review', 'Gemini suggests tasks and next steps. Nothing joins the project until you approve it.'],
];

export function MydnaAdvantages() {
  const [ref, seen] = useInView<HTMLElement>(0.2);
  return (
    <section ref={ref} className={`mm ms-adv ${seen ? 'is-in' : ''}`}>
      <header><small>Why ProjectHub</small><h2>Our advantages</h2></header>
      <div>
        {adv.map(([n, t, c], i) => (
          <article key={n} style={cv({ '--d': i })} tabIndex={0}>
            <span className="ms-tag">Advantage</span><ArrowUpRight className="ms-arrow" size={22} />
            <h3>{t}</h3><p>{c}</p><b>{n}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

/* Image frame that grows to full bleed on scroll, with a live HUD (ticking rate + ECG trace). */
export function MydnaExpand() {
  const ref = useRef<HTMLElement>(null);
  const [bpm, setBpm] = useState(92);
  useScrollVar(ref);
  useEffect(() => {
    const t = setInterval(() => setBpm((n) => Math.min(96, Math.max(88, n + (Math.random() > 0.5 ? 1 : -1)))), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <section ref={ref} className="mm mm-expand">
      <div className="mm-expand-frame">
        <div className="mm-scene" aria-hidden="true"><i /><i /><i /></div>
        <div className="mm-hud" role="img" aria-label="Illustrative live progress reading">
          <small>Sample reading</small><b>Average pace</b>
          <svg viewBox="0 0 240 60" preserveAspectRatio="none"><path pathLength="1" d="M0 30H46L54 30L62 6L72 54L80 30H124L132 30L140 14L148 44L156 30H240" /></svg>
          <strong>{bpm}<sup>tasks / wk</sup></strong>
        </div>
        <h2>Where you stopped,<br />always at hand</h2>
        <div className="mm-chips"><a href="#features">See the whole project</a><a href="#memory">Protect your focus</a></div>
      </div>
    </section>
  );
}

const team = [
  ['Alex Lee', 'Design lead', 'Keeps reviews moving and the plan clear.'],
  ['Jordan Reed', 'Launch owner', 'Owns the checklist from first draft to release.'],
  ['Morgan Kim', 'Notes and memory', 'Saves the stopping point so nothing is lost.'],
  ['Riley Chen', 'Project coordinator', 'Turns blockers into next steps for the team.'],
];

export function MydnaTeam() {
  const [a, setA] = useState(0);
  const [hold, setHold] = useState(false);
  const [ref, seen] = useInView<HTMLElement>(0.3);
  useEffect(() => {
    if (!seen || hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setA((n) => (n + 1) % team.length), 2200);
    return () => clearInterval(t);
  }, [seen, hold]);
  return (
    <section ref={ref} id="teams" className={`mm mm-team ${seen ? 'is-in' : ''}`}>
      <header><h2>Our team</h2><small>Illustrative people · team features are in development</small></header>
      <div className="mm-team-row">
        {team.map(([n, r, b], i) => (
          <article key={n} className={a === i ? 'is-on' : ''} tabIndex={0} style={cv({ '--d': i })}
            onMouseEnter={() => { setHold(true); setA(i); }} onMouseLeave={() => setHold(false)} onFocus={() => setA(i)}>
            <div className="mm-face" aria-hidden="true" />
            <h3>{n}</h3><small>{r}</small><p>{b}</p>
            <div className="mm-glass"><h4>{n}</h4><p>{b}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

const phases = [
  ['Idea', 'The idea takes shape: set the outcome and what success means.', 'linear-gradient(150deg,#e8e2ff,#bfb2ff)'],
  ['Plan', 'The plan becomes clear: milestones turn into tasks and owners.', 'linear-gradient(150deg,#dfeaff,#b9d2ff)'],
  ['Build', 'The work moves forward with files and decisions close by.', 'linear-gradient(150deg,#efe6ff,#d6c4ff)'],
  ['Review', 'Progress is visible: what is done, due soon or blocked.', 'linear-gradient(150deg,#e1f1ff,#c3e0ff)'],
  ['Launch', 'The release goes out with the checklist complete.', 'linear-gradient(150deg,#f0e8ff,#cbb8ff)'],
  ['Next', 'The next chapter begins from a saved stopping point.', 'linear-gradient(150deg,#e4e8ff,#b7c2ff)'],
];

/* Vertical wheel: active phase is huge, neighbours shrink and fade; the image card cross-fades. */
export function MydnaHistory() {
  const [a, setA] = useState(0);
  const [hold, setHold] = useState(false);
  const [ref, seen] = useInView<HTMLElement>(0.3);
  useEffect(() => {
    if (!seen || hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setA((n) => (n + 1) % phases.length), 2800);
    return () => clearInterval(t);
  }, [seen, hold]);
  return (
    <section ref={ref} className={`mm mm-hist ${seen ? 'is-in' : ''}`} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <small className="mm-hist-label">An illustrative project journey</small>
      <div className="mm-wheel" role="tablist" aria-label="Project phases">
        {phases.map(([p], i) => (
          <button type="button" role="tab" aria-selected={a === i} key={p} onClick={() => setA(i)}
            style={{ transform: `translate(${Math.min(156, 110 + Math.abs(i - a) * 15)}px, ${(i - a) * 68}px) scale(${i === a ? 1.08 : 0.42})`, opacity: Math.max(0, 1 - Math.abs(i - a) * 0.28) }} >{p}</button>
        ))}
      </div>
      <div className="mm-hist-card">
        {phases.map(([p, c, bg], i) => (
          <figure key={p} className={a === i ? 'is-on' : ''} aria-hidden={a !== i}><div style={{ background: bg }}><span>{p}</span></div><figcaption>{c}</figcaption></figure>
        ))}
      </div>
    </section>
  );
}

export function MydnaContact() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = `${f.get('message')}\n\n${f.get('name')} <${f.get('email')}>`;
    setSent(true);
    window.location.href = `mailto:support@projecthub.dev?subject=${encodeURIComponent(String(f.get('subject') || 'Hello'))}&body=${encodeURIComponent(body)}`;
  };
  return (
    <section ref={ref} id="contact" className={`mm mm-contact ${seen ? 'is-in' : ''}`}>
      <h2 aria-label="Contact us">{'CONTACT US'.split('').map((c, i) => <span key={i} aria-hidden="true" style={cv({ '--d': i })}>{c === ' ' ? '\u00A0' : c}</span>)}</h2>
      <div className="mm-biz" aria-hidden="true"><b>ProjectHub</b><span>support@projecthub.dev</span><span>Replies in one working day</span></div>
      <form onSubmit={submit}>
        <input name="name" placeholder="Name" required aria-label="Name" />
        <input name="email" type="email" placeholder="E-mail" required aria-label="E-mail" />
        <input name="subject" placeholder="Subject" aria-label="Subject" />
        <textarea name="message" placeholder="Message" required aria-label="Message" rows={4} />
        <button type="submit" className={sent ? 'is-sent' : ''} aria-label="Send message"><ArrowUp size={20} /><span>{sent ? 'Opened' : 'Send'}</span></button>
      </form>
    </section>
  );
}


/* =====================  PAGE  ===================== */

const features = [
  { label: 'Manage projects', detail: 'Projects, tasks, subtasks, milestones and deadlines, viewed as a board, list, timeline or calendar.', icon: FolderKanban, view: 'Project board', note: 'Launch readiness · 68%' },
  { label: 'Remember where you stopped', detail: 'Record each work session: what you finished, what blocked you and the next step.', icon: Clock3, view: 'Work sessions', note: 'The last session stopped at the registration flow' },
  { label: 'Keep files close', detail: 'Connect Google Drive and keep project files next to the tasks that need them.', icon: FileText, view: 'Project files', note: 'Drive connection is optional' },
  { label: 'Ask Gemini', detail: 'Summaries, next-step suggestions and task plans that you review before anything is added.', icon: Sparkles, view: 'AI assistant', note: 'Review the open blockers' },
  { label: 'Work together', detail: 'Invitations, permissions, messaging and calls are the team direction and are still in development.', icon: Users, view: 'Team workspace · planned', note: 'Team collaboration features are in development' },
];

const faqs = [
  { q: 'What is ProjectHub?', a: 'ProjectHub is a workspace for managing projects, remembering where you stopped, keeping files close and getting AI help with what to do next.' },
  { q: 'What is project memory?', a: 'After a work session you record what you completed, what went wrong and the next step. When you return, ProjectHub shows that summary first. Summaries come from what you record and what ProjectHub can access, not from guessing what happened in your editor.' },
  { q: 'Can I collaborate with a team?', a: 'Team invitations, permissions, messaging and calls are part of the plan and still in development. The free workspace supports up to two members including its owner; three or more members require an active subscription.' },
  { q: 'What can the AI assistant access?', a: 'Gemini can use project context and documents you choose to make available. Suggested tasks are reviewed by you before they are added, and AI responses should be checked against your project records.' },
  { q: 'Does connecting Google Drive back up my computer?', a: 'No. Drive access is limited to the account and files you connect. Automatic syncing of laptop folders would need a companion desktop app, which is on the roadmap.' },
  { q: 'Does ProjectHub connect to GitHub?', a: 'No. GitHub integration is not part of ProjectHub.' },
  { q: 'How much does a paid workspace cost?', a: 'Paid pricing has not been finalized. Workspaces with three or more members require an active subscription, and the price will be shown once plans are finalized.' },
];

function ProductPreview({ active = 1, autoPlay = false }: { active?: number; autoPlay?: boolean }) {
  const feature = features[active];
  return (
    <div className="marketing-window" role="region" aria-label={`Illustrative ${feature.view} workspace preview`}>
      <div className="marketing-window-bar">
        <div className="flex items-center gap-2"><BrandMark size={24} /><span className="text-sm font-semibold">ProjectHub</span></div>
        <div className="hidden items-center gap-1.5 sm:flex"><span className="window-dot" /><span className="window-dot" /><span className="window-dot" /></div>
        <span className="rounded-full border border-[var(--m-border)] px-2.5 py-1 text-[10px] text-[var(--m-muted)]">Sample project</span>
      </div>
      <div className="min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--m-border)] pb-4">
          <div><h3 className="text-lg font-semibold tracking-tight">{feature.view}</h3><p className="mt-1 text-[10px] text-[var(--m-muted)]">A realistic preview with illustrative project data</p></div>
          <div className="flex -space-x-2" aria-label="Illustrative team members"><span className="avatar-dot">A</span><span className="avatar-dot">J</span><span className="avatar-dot">M</span></div>
        </div>
        <div className="mt-4"><ProductDashboardDemo featureNote={feature.note} autoPlay={autoPlay} /></div>
      </div>
    </div>
  );
}

function ScrollReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-visible')); return; }
    document.documentElement.classList.add('has-scroll-reveal');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    items.forEach((i) => io.observe(i));
    return () => { io.disconnect(); document.documentElement.classList.remove('has-scroll-reveal'); };
  }, []);
  return null;
}

function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="mb-10 max-w-2xl"><p className="marketing-eyebrow">{eyebrow}</p><h2 className="marketing-h2">{title}</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[var(--m-muted)] sm:text-base">{copy}</p></div>;
}

export default function MarketingHomepage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="marketing-page mm min-h-screen overflow-x-clip bg-[var(--m-bg)] text-[var(--m-ink)]">
      <ScrollReveal />
      <a href="#main-content" className="marketing-skip">Skip to content</a>
      <MydnaHeader />

      <main id="main-content">
        <MydnaHero />

        <MydnaMarquee />

        <MydnaMission />

        <MydnaFan />

        

                

        

        <section id="features" className="marketing-section" data-reveal>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <Heading eyebrow="Explore ProjectHub" title="A connected home for the work." copy="Move between the plan, the work, the files, and the context behind every decision." />
            <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:gap-12">
              <div role="tablist" aria-label="ProjectHub features" className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <button type="button" role="tab" key={f.label} id={`feature-tab-${i}`} aria-selected={activeFeature === i} aria-controls="feature-preview" tabIndex={activeFeature === i ? 0 : -1}
                      onKeyDown={(e) => { const n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % features.length : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + features.length) % features.length : i; if (n !== i) { e.preventDefault(); setActiveFeature(n); document.getElementById(`feature-tab-${n}`)?.focus(); } }}
                      onClick={() => setActiveFeature(i)} className={`feature-tab ${activeFeature === i ? 'feature-tab-active' : ''}`}>
                      <span className="feature-tab-icon"><Icon size={17} /></span>
                      <span className="min-w-0 text-left"><span className="block text-sm font-semibold">{f.label}</span><span className="mt-1 hidden text-xs leading-5 text-[var(--m-muted)] sm:block">{f.detail}</span></span>
                      <ArrowUpRight className="ml-auto shrink-0 opacity-50" size={15} />
                    </button>
                  );
                })}
              </div>
              <div id="feature-preview" role="tabpanel" aria-labelledby={`feature-tab-${activeFeature}`} className="feature-preview-panel">
                <ProductPreview key={activeFeature} active={activeFeature} />
              </div>
            </div>
          </div>
        </section>

        <MydnaScience />



        <section id="planning" className="marketing-section mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8" data-reveal>
          <div>
            <Heading eyebrow="Work sessions" title="Close every session on purpose." copy="Record what you finished, what went wrong and what comes next. It takes a minute and saves the next hour." />
            <Link className="marketing-inline-link" href="/signup">Start a project <ArrowRight size={14} /></Link>
          </div>
          <div className="planning-visual sess">
            <div className="flex items-start justify-between"><div><p className="text-[10px] text-[var(--m-muted)]">Today’s work session · sample</p><h3 className="mt-2 text-lg font-semibold">Authentication system</h3></div><span className="rounded-full border border-[var(--m-border)] px-2.5 py-1 text-[10px]">Recorded</span></div>
            {[['Completed', 'Created the login page', 'done'], ['Updated', 'Registration form validation', 'done'], ['Problem', 'Password reset email is not working', 'warn'], ['Not completed', 'Testing the registration flow', 'todo'], ['Next step', 'Fix password reset, then test authentication', 'next']].map(([k, v, t], i) => (
              <div key={k} className={`sess-row sess-${t}`} style={{ '--d': i } as CSSProperties}><span>{k}</span><p>{v}</p></div>
            ))}
          </div>
        </section>

        <MydnaAdvantages />

        <section id="memory" className="memory-section marketing-section" data-reveal>
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:px-8">
            <div className="memory-story-copy">
              <Heading eyebrow="Project memory" title="Pick up right where you left off." copy="Save completed work, the stopping point, current blockers, and a next step, then use that context to resume." />
              <p className="text-xs leading-6 text-[var(--m-muted)]">This interactive sample stays in the browser and does not create a real work session.</p>
            </div>
            <ProjectMemoryDemo />
          </div>
        </section>

        <MydnaHistory />

        <section id="ai" className="marketing-section mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8" data-reveal>
          <div>
            <Heading eyebrow="AI project assistant" title="Useful context, when you need it." copy="Ask Gemini to summarize a project, answer “what should I work on next?”, or draft a task plan you can review before it joins the project." />
            <p className="max-w-lg text-xs leading-6 text-[var(--m-muted)]">AI responses are suggestions. Verify recommendations against the project history before treating them as facts.</p>
          </div>
          <AssistantDemo />
        </section>

        <MydnaTeam />

        <section id="files" className="marketing-section mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8" data-reveal>
          <div>
            <Heading eyebrow="Files and reminders" title="Your files and deadlines, always within reach." copy="Connect Google Drive to keep project files near the work, and get reminded about deadlines, overdue tasks and the sessions you planned to continue." />
            <p className="text-xs leading-6 text-[var(--m-muted)]">Connecting Drive does not back up your computer. Automatic laptop-folder sync needs a companion desktop app, which is on the roadmap.</p>
          </div>
          <div className="drive-preview sync-demo">
            <div className="flex items-center justify-between border-b border-[var(--m-border)] pb-3"><div className="flex items-center gap-2 text-xs font-semibold"><FolderKanban size={15} /> Authentication system</div><span className="text-[10px] text-[var(--m-muted)]">Illustrative linked files</span></div>
            {[['Auth flow notes.md', 'Notes · sample file'], ['Login screens.fig', 'Design · sample file'], ['Reset email spec.docx', 'Document · sample file']].map(([n, m], i) => (
              <div key={n} className="sync-file flex items-center gap-3 border-b border-[var(--m-border)] py-4" style={{ '--d': i } as CSSProperties}><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--m-soft)]"><FileText size={15} /></span><span className="flex-1"><span className="block text-xs font-medium">{n}</span><span className="mt-1 block text-[10px] text-[var(--m-muted)]">{m}</span></span><Paperclip size={14} className="sync-ping text-[var(--m-muted)]" /></div>
            ))}
            <div className="mt-5 flex flex-wrap gap-2">{['Deadline · Oct 28', 'Overdue · 1 task', 'Continue · registration flow'].map((r, i) => <span key={r} className="rem-chip" style={{ '--d': i } as CSSProperties}><Bell size={11} /> {r}</span>)}</div>
          </div>
        </section>

        <section id="views" className="immersive-workspace-section" data-reveal>
          <div className="immersive-workspace-inner">
            <div className="immersive-workspace-heading"><div><p className="marketing-eyebrow">The workspace, up close</p><h2>Many moving parts.<br /><em>One clear view.</em></h2></div><p>Switch between Board, List, and Timeline. Update a sample task to see its status and project progress change.</p></div>
            <div className="immersive-workspace-frame"><ProductPreview active={0} autoPlay /></div>
          </div>
        </section>

        <section id="pricing" className="pricing-section" data-reveal>
          <div className="pricing-inner">
            <header className="pricing-heading">
              <p className="marketing-eyebrow">Simple membership</p>
              <h2>Pricing</h2>
              <p>Start with a free workspace. Ask us about team access while paid pricing is being finalized.</p>
            </header>
            <div className="pricing-grid">
              <article className="pricing-card">
                <p className="pricing-tier">Free workspace</p>
                <h3>Free</h3>
                <p className="pricing-description">For individuals and small teams getting started.</p>
                <ul className="pricing-benefits">
                  <li><Check size={15} /> Up to two members, owner included</li>
                  <li><Check size={15} /> Projects, tasks, files and work sessions</li>
                  <li><Check size={15} /> Start using ProjectHub for free</li>
                </ul>
                <Link href="/signup" className="pricing-action">Get started free <ArrowRight size={15} /></Link>
              </article>

              <article className="pricing-card pricing-card-featured">
                <p className="pricing-tier">Growing teams</p>
                <h3>3+ members</h3>
                <p className="pricing-description">An active subscription is required for workspaces with three or more members.</p>
                <ul className="pricing-benefits">
                  <li><Check size={15} /> Team workspace access</li>
                  <li><Check size={15} /> Paid pricing is being finalized</li>
                  <li><Check size={15} /> No unpublished price is assumed</li>
                </ul>
                <a href="mailto:support@projecthub.dev" className="pricing-action">Ask about team access <ArrowRight size={15} /></a>
              </article>

              <article className="pricing-card">
                <p className="pricing-tier">Pricing update</p>
                <h3>Coming soon</h3>
                <p className="pricing-description">We’ll publish paid plan details here when the pricing is confirmed.</p>
                <ul className="pricing-benefits">
                  <li><Check size={15} /> Clear plan details</li>
                  <li><Check size={15} /> Confirmed team pricing</li>
                  <li><Check size={15} /> Shared directly with you</li>
                </ul>
                <a href="mailto:support@projecthub.dev" className="pricing-action">Contact us <ArrowRight size={15} /></a>
              </article>
            </div>
          </div>
        </section>

        <MydnaContact />

        <section id="faq" className="marketing-section mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20" data-reveal>
          <Heading eyebrow="FAQ" title="A few useful answers." copy="What to expect when you start using ProjectHub." />
          <div className="divide-y divide-[var(--m-border)] border-y border-[var(--m-border)]">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold" aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{f.q}</span><ChevronDown className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} size={16} /></button>
                <div id={`faq-answer-${i}`} className={`faq-answer ${openFaq === i ? 'faq-answer-open' : ''}`} aria-hidden={openFaq !== i}><p className="max-w-3xl pb-5 text-xs leading-6 text-[var(--m-muted)]">{f.a}</p></div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--m-border)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto_auto_auto] lg:px-8">
          <div><Link href="/" className="flex items-center gap-2"><BrandMark size={25} /><span className="text-sm font-semibold">ProjectHub</span></Link><p className="mt-3 max-w-xs text-xs leading-5 text-[var(--m-muted)]">Projects, tasks, work sessions, and context in one place.</p></div>
          <div className="footer-group"><p>Product</p><a href="#features">Features</a><a href="#planning">Project planning</a><a href="#memory">Project memory</a></div>
          <div className="footer-group"><p>Explore</p><a href="#ai">AI assistant</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
          <div className="footer-group"><p>Account</p><Link href="/login">Log in</Link><Link href="/signup">Get started</Link><a href="mailto:support@projecthub.dev">Contact support</a></div>
        </div>
        <div className="border-t border-[var(--m-border)] px-4 py-4 text-center text-[10px] text-[var(--m-muted)]">ProjectHub · Built for clearer work.</div>
      </footer>
    </div>
  );
}