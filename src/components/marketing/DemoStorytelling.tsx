'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Sparkles } from 'lucide-react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Types text out one character at a time while `run` is true. */
function useTypewriter(text: string, run: boolean, speed = 16) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) { setN(0); return; }
    if (reduced()) { setN(text.length); return; }
    setN(0);
    const t = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(t); return k; } return k + 1; }), speed);
    return () => clearInterval(t);
  }, [run, text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

/* Cycles through status lines while `run` is true. */
function useSteps(lines: string[], run: boolean, every = 520) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run) { setI(0); return; }
    const t = setInterval(() => setI((k) => Math.min(k + 1, lines.length - 1)), every);
    return () => clearInterval(t);
  }, [run, lines.length, every]);
  return lines[i];
}

const memorySteps = ['Reading the saved notes…', 'Checking open blockers…', 'Lining up the next step…'];
const assistantSteps = ['Reading sample project history…', 'Checking the open blockers…', 'Drafting a summary…'];
const answer = 'This project has completed its initial design and login interface. Registration validation is still in progress, and password reset remains unresolved. The next recommended step is to fix and test password reset.';

export function ProjectMemoryDemo() {
  const [phase, setPhase] = useState<'saved' | 'reviewing' | 'resumed'>('saved');
  const status = useSteps(memorySteps, phase === 'reviewing');

  useEffect(() => {
    if (phase !== 'reviewing') return;
    const timer = window.setTimeout(() => setPhase('resumed'), 1700);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div className="memory-timeline">
      <div className="memory-line" />
      <article className="memory-step">
        <span className="memory-step-marker"><CheckCircle2 size={15} /></span>
        <div className="memory-card">
          <p className="text-[10px] uppercase tracking-wider text-[var(--m-muted)]">4:18 PM · Sample session saved</p>
          <h3 className="mt-2 text-sm font-semibold">Authentication system</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><p className="memory-label">Completed</p><p className="memory-copy">Created the login page and updated registration validation.</p></div>
            <div><p className="memory-label">Stopped at</p><p className="memory-copy">Testing the registration flow.</p></div>
            <div><p className="memory-label">Blocker</p><p className="memory-copy">Password reset email is not working.</p></div>
            <div><p className="memory-label">Next step</p><p className="memory-copy">Fix password reset, then test authentication.</p></div>
          </div>
        </div>
      </article>
      <article className="memory-step">
        <span className={`memory-step-marker ${phase === 'reviewing' ? 'memory-marker-active' : ''}`}><Sparkles size={14} /></span>
        <div className="memory-card memory-resume-card">
          <p className="text-[10px] uppercase tracking-wider text-[var(--m-muted)]">Project memory · demonstration</p>
          {phase === 'reviewing' ? (
            <div className="mt-3" role="status">
              <p className="text-xs text-[var(--m-muted)]">{status}</p>
              <div className="memory-scan" aria-hidden="true"><i /></div>
            </div>
          ) : phase === 'resumed' ? (
            <>
              <h3 className="mt-2 text-sm font-semibold">You’re back in the project.</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--m-muted)]">Next up: fix the password reset email, then test the registration flow.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold"><span className="memory-check"><CheckCircle2 size={13} /></span> Sample context resumed</span>
              <button type="button" className="mt-3 block text-[10px] font-semibold hover:underline" onClick={() => setPhase('saved')}>Play again</button>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-semibold">Ready to pick up where you stopped?</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--m-muted)]">Review the saved note, blocker, and suggested next step.</p>
              <button type="button" className="marketing-button marketing-button-dark mt-4 min-h-9" onClick={() => setPhase('reviewing')}>Continue working <ArrowRight size={14} /></button>
              <p className="mt-3 text-[9px] text-[var(--m-muted)]">Sample project only · no real workspace changes</p>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

export function AssistantDemo() {
  const [phase, setPhase] = useState<'idle' | 'reviewing' | 'answer'>('idle');
  const status = useSteps(assistantSteps, phase === 'reviewing', 480);
  const { shown, done } = useTypewriter(answer, phase === 'answer');

  useEffect(() => {
    if (phase !== 'reviewing') return;
    const timer = window.setTimeout(() => setPhase('answer'), 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div className="ai-preview ai-sequence">
      <div className="flex items-center gap-3 border-b border-[var(--m-border)] pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--m-border)]"><Sparkles size={17} /></span><div><p className="text-sm font-semibold">Project assistant</p><p className="text-[10px] text-[var(--m-muted)]">Illustrative Gemini demo · sample context</p></div></div>
      <div className="ml-auto mt-5 max-w-[85%] rounded-lg bg-[var(--m-soft)] p-3 text-xs">What should I work on next in the Authentication project?</div>
      {phase === 'idle' && <button type="button" className="marketing-button marketing-button-outline mt-4 min-h-9" onClick={() => setPhase('reviewing')}>Run the sample demo <ArrowRight size={13} /></button>}
      {phase === 'reviewing' && <div className="ai-thinking mt-4" role="status"><span /><span /><span /> {status}</div>}
      {phase === 'answer' && (
        <div className="ai-demo-answer mt-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold"><Clock3 size={12} /> Sample history reviewed</p>
          <p className="mt-2 min-h-[72px] text-xs leading-6 text-[var(--m-muted)]" aria-live="polite">{shown}{!done && <span className="ai-caret" aria-hidden="true">▍</span>}</p>
          <p className="mt-3 border-t border-[var(--m-border)] pt-3 text-[9px] text-[var(--m-muted)]">Illustrative answer · no AI request sent</p>
          <button type="button" className="mt-3 text-[10px] font-semibold hover:underline" onClick={() => setPhase('idle')}>Play again</button>
        </div>
      )}
      <p className="mt-4 text-[9px] text-[var(--m-muted)]">The production assistant uses authorized project context; verify recommendations against project history.</p>
    </div>
  );
}