'use client';

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import Link from 'next/link';
import { Anton, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { useTheme } from '@/context/ThemeContext';
import './landing.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--ph-anton' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--ph-hanken' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--ph-mono' });

const NAV = [
  ['Memory', '#memory'],
  ['Features', '#features'],
  ['Workflow', '#workflow'],
  ['Security', '#security'],
  ['Dashboard', '#dashboard'],
  ['Pricing', '#plans'],
  ['FAQ', '#faq'],
];

const TOOLS = ['Google Drive', 'Gemini', 'LiveKit', 'Supabase', 'Next.js', 'Vercel'];
const BARS = [30, 45, 40, 62, 55, 78, 70, 92, 64, 48, 82, 100];
const STATS = [
  { target: 2, label: 'Members free per workspace' },
  { target: 6, label: 'Connected work areas' },
];

const PERMISSIONS = ['edit tasks', 'upload files', 'delete files', 'invite people'];

const TASKS = [
  { title: 'Design the login interface', label: 'Done', overdue: false, done: true },
  { title: 'Add form validation', label: 'Done', overdue: false, done: true },
  { title: 'Connect authentication', label: 'Overdue', overdue: true, done: false },
  { title: 'Test error handling', label: 'Due Friday', overdue: false, done: false },
  { title: 'Upload wireframes to Drive', label: 'Due Monday', overdue: false, done: false },
];

const NOTIFICATIONS = [
  'New task assigned: Test error handling',
  'Deadline tomorrow: Upload wireframes',
  'Invitation accepted',
  'Permissions changed by the owner',
];

const STEPS = [
  ['Create a project', 'Add the description, tasks, deadlines and milestones.'],
  ['Connect Google Drive', 'Choose the folder that holds your files.'],
  ['Invite your friend', 'They accept the invitation and join.'],
  ['Set permissions', 'Decide who edits, uploads, invites or changes settings.'],
  ['Divide the work', 'Assign tasks and deadlines to each person.'],
  ['Talk it through', 'Use project chat, or start a voice or video call.'],
  ['Ask Gemini', 'Explain a document, summarize progress, get a next task.'],
  ['Save your place', 'Leave a continuation note at the end of each session.'],
  ['Add teammates', 'The owner upgrades when a third member joins.'],
  ['Finish and report', 'Review history and export a PDF or CSV report.'],
];

const SECURITY = [
  ['Separate workspaces', 'Private projects stay private.'],
  ['Owner-controlled access', "Admins can't promote themselves or take ownership."],
  ['Careful Drive access', 'Joining a project never opens your whole Drive.'],
  ['Protected secrets', 'API keys and OAuth tokens stay on the server.'],
  ['Verified billing', 'Payments are confirmed server-side before a plan changes.'],
  ['Audit log', 'Permission, member, ownership and billing changes are recorded.'],
];

const FAQ = [
  ['Do I have to invite anyone?', 'No. You can manage personal projects on your own. Invite people only when you want to work together.'],
  ['Am I charged for sending an invitation?', 'No. ProjectHub checks real workspace membership and subscription eligibility when the invitation is accepted.'],
  ['Can Gemini be wrong?', "Yes. Suggestions aren't guaranteed to be correct. Answers are based on your stored records, and suggested information is labeled so you can review and edit it."],
  ['Will teammates see my whole Google Drive?', 'No. Both workspace permissions and Drive access rules are checked, and joining a project never opens your personal Drive.'],
  ['Does it back up my laptop folders?', "No. Connecting Drive isn't automatic backup. Syncing local folders would be a separate feature."],
  ['What happens if a subscription ends?', "Your team's data is preserved, and the workspace moves into a defined restricted or grace-period state."],
  ['Are calls transcribed automatically?', 'Not by default. You can save meeting notes and decisions manually. AI summaries or transcription need extra setup and permissions.'],
];

const BOARD_FACTS = [
  ['Assignee', 'Who is responsible for each task.'],
  ['Priority and due date', "What matters most and when it's due."],
  ['Comments and files', 'Discussion and Drive files stay on the task.'],
  ['Subtasks', 'Break big work into smaller steps.'],
];

const FILES = [
  ['requirements.pdf', 'Linked to task'],
  ['login-form.tsx', 'Shared'],
  ['wireframes.png', 'Owner only'],
];

function Bookmark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 22 26" aria-hidden="true">
      <path d="M2 0h18a2 2 0 0 1 2 2v24l-11-7L0 26V2a2 2 0 0 1 2-2z" fill="#F5A623" />
    </svg>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  const [dk, setDk] = useState(false); // header turns dark after the hero
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState([0, 0]);
  const [barsOn, setBarsOn] = useState(false);
  const [perms, setPerms] = useState<Record<string, boolean>>({
    'edit tasks': true,
    'upload files': true,
    'delete files': false,
    'invite people': false,
  });
  const [done, setDone] = useState(TASKS.map((t) => t.done));
  const [members, setMembers] = useState(3);
  const [email, setEmail] = useState('');
  const [formMsg, setFormMsg] = useState('');

  // Header switches style once you scroll past most of the hero
  useEffect(() => {
    const onScroll = () => setDk(window.scrollY > (heroRef.current?.offsetHeight ?? 700) * 0.55);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero stats count up
  useEffect(() => {
    const h = setInterval(() => {
      setCounts((c) => {
        const n = c.map((v, i) => Math.min(v + 1, STATS[i].target));
        if (n.every((v, i) => v === STATS[i].target)) clearInterval(h);
        return n;
      });
    }, 180);
    return () => clearInterval(h);
  }, []);

  // Bar chart grows when it scrolls into view
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setBarsOn(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onHeroMove = (e: PointerEvent) => {
    const el = sceneRef.current;
    if (!el) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 26;
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    el.style.transform = `translate(${x}px,${y}px)`;
  };

  // Permission verdict
  const on = PERMISSIONS.filter((p) => perms[p]);
  const off = PERMISSIONS.filter((p) => !perms[p]);
  const verdict =
    (on.length ? `Your friend can ${on.join(', ')}. ` : 'Your friend can only view. ') +
    (off.length ? `They can't ${off.join(' or ')}.` : 'All member permissions are on.');

  // Dashboard numbers
  const doneCount = done.filter(Boolean).length;
  const overdue = TASKS.filter((t, i) => !done[i] && t.overdue).length;
  const soon = TASKS.filter((t, i) => !done[i] && !t.overdue).length;
  const pct = Math.round((doneCount / TASKS.length) * 100);

  const planText =
    members <= 2
      ? `${members} ${members === 1 ? 'member' : 'members'}: free.`
      : `${members} members: a paid Team subscription is required, checked when the invitation is accepted.`;

  const onSubmitEmail = (e: FormEvent) => {
    e.preventDefault();
    // TODO: save this email (for example to a Supabase "early_access" table)
    setFormMsg(`Request noted for ${email}.`);
    setEmail('');
  };

  return (
    <div className={`ph ${anton.variable} ${hanken.variable} ${mono.variable}${dk ? ' dk' : ''}`}>
      <a className="skip m" href="#top">
        Skip to content
      </a>

      <header>
        <div className="wrap">
          <a className="logo" href="#top">
            <Bookmark />
            ProjectHub
          </a>
          <nav className={`m${menuOpen ? ' open' : ''}`} id="nv" aria-label="Main">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="side">
            <Link className="m" href="/login">
              Sign in
            </Link>
            <button
              className="tt m"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <Link className="btn" href="/signup">
              Start free
            </Link>
            <button
              className="mb m"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="nv"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero" id="memory" ref={heroRef} onPointerMove={onHeroMove}>
          <div className="wrap">
            <h1>
              Two weeks off.
              <br />
              <span>Zero lost.</span>
            </h1>
            <div className="hl">
              <div>
                <p>
                  The project workspace that remembers where you stopped. Tasks, files, chat and Gemini in one place.
                </p>
                <div className="row">
                  <Link className="btn" href="/signup">
                    Create a project &rarr;
                  </Link>
                  <a className="m" href="#workflow">
                    See how it works
                  </a>
                </div>
              </div>
              <div className="stats">
                {STATS.map((s, i) => (
                  <div key={s.label}>
                    <b>{counts[i]}</b>
                    <small className="m">{s.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="scene" ref={sceneRef} aria-hidden="true">
            <div className="cube">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div className="f" key={n} />
              ))}
              <div className="mark" />
              <div className="mark b" />
            </div>
          </div>

          <svg className="rocks" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="phg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1c2c42" />
                <stop offset=".5" stopColor="#0b1424" />
                <stop offset="1" stopColor="#060B14" />
              </linearGradient>
            </defs>
            <path d="M0 400V150L60 120 110 150 160 60 230 110 300 40 380 140 450 200 520 400Z" fill="url(#phg)" />
            <path d="M0 400V250L80 210 140 260 200 190 290 300 360 400Z" fill="#0a111f" opacity=".9" />
            <path d="M1440 400V130L1370 160 1320 90 1250 170 1190 110 1120 220 1050 270 980 400Z" fill="url(#phg)" />
            <path d="M1440 400V260L1360 230 1300 300 1230 250 1160 400Z" fill="#0a111f" opacity=".9" />
            <path d="M0 400V360C300 330 520 380 720 350S1180 330 1440 370V400Z" fill="#060B14" />
            <path
              d="M160 60L230 110M300 40L380 140M1320 90L1250 170M1190 110L1120 220"
              stroke="#6f93b8"
              strokeOpacity=".35"
              fill="none"
            />
          </svg>
        </section>

        <div className="int">
          <div className="wrap m">
            <span>Works with</span>
            {TOOLS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        <section className="cap">
          <div className="wrap">
            <div>
              <h2>Organized</h2>
              <p>Projects, tasks, deadlines and milestones, with an owner for every one.</p>
            </div>
            <div>
              <h2>Remembered</h2>
              <p>Gemini keeps the thread, so a break never means starting over.</p>
            </div>
          </div>
        </section>

        <section className="ter" id="features">
          <div className="wrap">
            <h2>Calm, organized progress</h2>
            <div className="stack">
              <article className="pn">
                <div className="m">Project memory</div>
                <div className="m">
                  Tasks done <span className="tag">14</span>
                </div>
                <div className="bars" ref={barsRef} aria-hidden="true">
                  {BARS.map((h, k) => (
                    <i key={k} style={{ height: `${barsOn ? h : 6}%`, transitionDelay: `${k * 60}ms` }} />
                  ))}
                </div>
                <p>
                  Record what you finished, what went wrong and what&apos;s left. Come back to the latest known state.
                </p>
              </article>

              <article className="pn">
                <div className="m">Gemini assistant</div>
                <div className="big">{'"Where did I stop?"'}</div>
                <div className="vd">
                  You built the login form. Successful login isn&apos;t tested against the backend yet.{' '}
                  <span className="tag">Suggested</span>
                </div>
                <p>Summaries, file and code explanations, checklists and weekly reports based on stored records.</p>
              </article>

              <article className="pn">
                <div className="m">Google Drive</div>
                <div className="files">
                  {FILES.map(([name, tag]) => (
                    <div key={name}>
                      <span>{name}</span>
                      <span className="m">{tag}</span>
                    </div>
                  ))}
                </div>
                <p>Pick a folder, then upload, browse and link files. Workspace and Drive permissions are both checked.</p>
              </article>

              <article className="pn">
                <div className="m">Team permissions</div>
                {PERMISSIONS.map((p) => (
                  <label className="tg" key={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                    <input
                      type="checkbox"
                      checked={perms[p]}
                      onChange={(e) => setPerms((prev) => ({ ...prev, [p]: e.target.checked }))}
                    />
                    <i />
                  </label>
                ))}
                <div className="vd" aria-live="polite">
                  {verdict}
                </div>
                <p>The owner grants or revokes each permission per person.</p>
              </article>

              <article className="pn">
                <div className="m">Chat and calls</div>
                <div className="msg">Login works locally. Can you test the backend?</div>
                <div className="msg me">On it. Starting a call.</div>
                <p>Project chat with history and mentions, plus voice and video calls inside the workspace.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="brd" id="boards">
          <div className="wrap">
            <div className="bg">
              <div className="st" role="img" aria-label="Project board with tasks in to-do, in-progress, and complete columns">
                <div className="board" aria-hidden="true">
                  <div className="board-column">
                    <b>To do</b>
                    <div className="board-card">Upload wireframes</div>
                    <div className="board-card">Review requirements</div>
                  </div>
                  <div className="board-column">
                    <b>In progress</b>
                    <div className="board-card">Build login form</div>
                    <div className="board-card">Test validation</div>
                  </div>
                  <div className="board-column">
                    <b>Complete</b>
                    <div className="board-card">Create project</div>
                  </div>
                </div>
              </div>
              <div>
                <h2>
                  Move work
                  <br />
                  across the board
                </h2>
                <p>
                  Every task has an owner, a due date and a status, so anyone can see what&apos;s done, what&apos;s
                  overdue and who is responsible.
                </p>
                <ul>
                  {BOARD_FACTS.map(([k, v]) => (
                    <li key={k}>
                      <b className="m">{k}</b>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="dash" id="dashboard">
          <div className="wrap">
            <h2>
              Your next action,
              <br />
              one screen away
            </h2>
            <div className="dg">
              <article className="pn">
                <div className="m">Dashboard: E-commerce website</div>
                <div className="kp">
                  <div>
                    <b>{soon}</b>
                    <small className="m">Due soon</small>
                  </div>
                  <div>
                    <b>{overdue}</b>
                    <small className="m">Overdue</small>
                  </div>
                  <div>
                    <b>{pct}%</b>
                    <small className="m">Complete</small>
                  </div>
                </div>
                <div className="pg">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div>
                  {TASKS.map((t, i) => (
                    <label className="tk" key={t.title}>
                      <input
                        type="checkbox"
                        checked={done[i]}
                        onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                      />
                      <span>{t.title}</span>
                      <b className="m">{done[i] ? 'Done' : t.label}</b>
                    </label>
                  ))}
                </div>
                <p>Tick a task to see the numbers update. Active projects, recent files and quick access to Gemini sit alongside.</p>
              </article>

              <article className="pn">
                <div className="m">Notifications and reports</div>
                <div>
                  {NOTIFICATIONS.map((n) => (
                    <div className="nt" key={n}>
                      {n}
                    </div>
                  ))}
                </div>
                <p>
                  In-app alerts with optional email, set by each person. Reports cover completed work, blockers and
                  overdue items, and export to PDF or CSV. An audit log records important admin changes.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="flow" id="workflow">
          <div className="wrap">
            <h2>
              From first task
              <br />
              to final report
            </h2>
            <ol>
              {STEPS.map(([title, text]) => (
                <li className="s" key={title}>
                  <div>
                    <b>{title}</b>
                    <span>{text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="plans" id="plans">
          <div className="wrap">
            <h2>
              Free for two.
              <br />
              Paid for a team.
            </h2>
            <div className="pk" role="group" aria-label="Members in workspace">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-pressed={members === n} onClick={() => setMembers(n)}>
                  {n}
                </button>
              ))}
            </div>
            <p className="m pv" aria-live="polite">
              {planText}
            </p>
            <div className="pl">
              <article className={`pn${members <= 2 ? ' on' : ''}`}>
                <div className="m">Free</div>
                <div className="big">1 to 2 members</div>
                <ul>
                  <li>Owner included in the count</li>
                  <li>Personal and shared projects</li>
                  <li>Core project and task features</li>
                  <li>Drive and Gemini within usage limits</li>
                </ul>
              </article>
              <article className={`pn${members > 2 ? ' on' : ''}`}>
                <div className="m">Team</div>
                <div className="big">3+ members</div>
                <ul>
                  <li>Larger shared workspaces</li>
                  <li>Chat, calls and collaboration</li>
                  <li>Higher usage limits</li>
                  <li>Billing and subscription management</li>
                </ul>
              </article>
            </div>
            <p className="m note">
              Pricing to be announced. Your data is kept if a subscription ends. Limits apply per workspace.
            </p>
          </div>
        </section>

        <section className="sec" id="security">
          <div className="wrap">
            <h2>
              The server decides,
              <br />
              not the screen
            </h2>
            <ul>
              {SECURITY.map(([title, text]) => (
                <li key={title}>
                  <b className="m">{title}</b>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="wrap">
            <h2>
              Questions,
              <br />
              answered
            </h2>
            <div className="it">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="fin">
          <div className="wrap">
            <h2>
              Don&apos;t rebuild
              <br />
              <span>from memory.</span>
            </h2>
            <form className="fm" onSubmit={onSubmitEmail}>
              <label className="m" htmlFor="ph-email">
                Get early access
              </label>
              <input
                id="ph-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn lt" type="submit">
                Request access
              </button>
            </form>
            <p className="m fk" aria-live="polite">
              {formMsg}
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap f2">
          <div className="fc">
            <div>
              <div className="logo">
                <Bookmark />
                ProjectHub
              </div>
              <p style={{ marginTop: 12, maxWidth: '30ch', fontSize: '.95rem' }}>
                Projects, files, people and memory in one place.
              </p>
            </div>
            <div className="m">
              <b>Product</b>
              <a href="#features">Features</a>
              <a href="#dashboard">Dashboard</a>
              <a href="#workflow">Workflow</a>
              <a href="#plans">Pricing</a>
            </div>
            <div className="m">
              <b>Account</b>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Create account</Link>
              <a href="#security">Security</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="m">
              <b>Company</b>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
          <div className="fb m">
            <span>&copy; 2026 ProjectHub</span>
            <a href="#top">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}