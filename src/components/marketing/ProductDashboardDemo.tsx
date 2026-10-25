'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, Circle, Clock3, Sparkles, X } from 'lucide-react';

type DemoStatus = 'To do' | 'In progress' | 'Blocked' | 'Done';
type DemoView = 'Board' | 'List' | 'Timeline';
type DemoPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
type DemoTask = { id: number; title: string; status: DemoStatus; priority: DemoPriority; due: string };

const startingTasks: DemoTask[] = [
  { id: 1, title: 'Review onboarding flow', status: 'In progress', priority: 'High', due: 'Oct 28' },
  { id: 2, title: 'Finalize launch checklist', status: 'To do', priority: 'Medium', due: 'Oct 29' },
  { id: 3, title: 'Prepare release notes', status: 'To do', priority: 'Low', due: 'Oct 30' },
  { id: 4, title: 'Confirm product screenshots', status: 'Blocked', priority: 'Urgent', due: 'Oct 30' },
  { id: 5, title: 'Research customer needs', status: 'Done', priority: 'Medium', due: 'Oct 22' },
];

const statuses: DemoStatus[] = ['To do', 'In progress', 'Blocked', 'Done'];
const priorities: DemoPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

function PriorityDot({ priority }: { priority: DemoPriority }) {
  return <span className={`demo-priority demo-priority-${priority.toLowerCase()}`}><span />{priority}</span>;
}

export default function ProductDashboardDemo({
  featureNote,
  autoPlay = false,
}: {
  featureNote: string;
  autoPlay?: boolean;
}) {
  const [tasks, setTasks] = useState(startingTasks);
  const [view, setView] = useState<DemoView>('Board');
  const [statusFilter, setStatusFilter] = useState<'All statuses' | DemoStatus>('All statuses');
  const [priorityFilter, setPriorityFilter] = useState<'All priorities' | DemoPriority>('All priorities');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const instanceId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const detailRef = useRef<HTMLElement>(null);
  const completedCount = tasks.filter((task) => task.status === 'Done').length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    if (!autoPlay) return;
    const notificationTimer = window.setTimeout(() => setNotificationOpen(true), 1550);
    const assistantTimer = window.setTimeout(() => setAssistantOpen(true), 2200);
    return () => {
      window.clearTimeout(notificationTimer);
      window.clearTimeout(assistantTimer);
    };
  }, [autoPlay]);

  useEffect(() => {
    if (selectedTaskId === null) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    detailRef.current?.querySelector<HTMLElement>('button, select')?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTaskId(null);
        return;
      }
      if (event.key !== 'Tab' || !detailRef.current) return;
      const controls = Array.from(detailRef.current.querySelectorAll<HTMLElement>('button, select'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [selectedTaskId]);

  const visibleTasks = useMemo(() => tasks.filter((task) =>
    (statusFilter === 'All statuses' || task.status === statusFilter) &&
    (priorityFilter === 'All priorities' || task.priority === priorityFilter)
  ), [priorityFilter, statusFilter, tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const viewOptions: DemoView[] = ['Board', 'List', 'Timeline'];
  const handleViewKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % viewOptions.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + viewOptions.length) % viewOptions.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = viewOptions.length - 1;
    else return;
    event.preventDefault();
    setView(viewOptions[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };

  const updateStatus = (taskId: number, status: DemoStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, status } : item));
    setAnnouncement(`${task.title} moved to ${status}. Demo progress is now ${Math.round(((completedCount + (status === 'Done' && task.status !== 'Done' ? 1 : status !== 'Done' && task.status === 'Done' ? -1 : 0)) / tasks.length) * 100)} percent.`);
  };

  return (
    <div className="demo-workspace" role="region" aria-label="Interactive sample project workspace">
      <div className="demo-toolbar">
        <div className="flex items-center gap-1" role="tablist" aria-label="Sample project view">
          {viewOptions.map((item, index) => (
            <button ref={(element) => { tabRefs.current[index] = element; }} id={`demo-view-${instanceId}-${index}`} key={item} type="button" role="tab" aria-controls={`demo-view-panel-${instanceId}`} aria-selected={view === item} tabIndex={view === item ? 0 : -1} onKeyDown={(event) => handleViewKeyDown(event, index)} onClick={() => setView(item)} className={`demo-view-tab ${view === item ? 'demo-view-tab-active' : ''}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="demo-progress" role="img" aria-label={`Sample project is ${progress} percent complete`}>
          <svg viewBox="0 0 36 36" aria-hidden="true"><circle className="demo-progress-track" cx="18" cy="18" r="15.5" /><circle className="demo-progress-value" cx="18" cy="18" r="15.5" style={{ strokeDashoffset: `${97.4 - (progress / 100) * 97.4}` }} /></svg>
          <span><strong>{progress}%</strong><small>complete</small></span>
        </div>
      </div>

      <div className="demo-filters">
        <label>Status <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Priority <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}><option>All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
        <span className="demo-sample-label">DEMO DATA</span>
      </div>

      <div className="demo-view-content" role="tabpanel" id={`demo-view-panel-${instanceId}`} aria-labelledby={`demo-view-${instanceId}-${viewOptions.indexOf(view)}`}>
        {view === 'Board' && (
          <div className="demo-board">
            {statuses.map((status) => {
              const columnTasks = visibleTasks.filter((task) => task.status === status);
              return <section key={status} className="demo-column" aria-label={`${status} tasks`}>
                <div className="demo-column-title"><span>{status}</span><span>{columnTasks.length}</span></div>
                {columnTasks.map((task, index) => <button type="button" key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`demo-task-card ${autoPlay ? 'demo-task-enter' : ''}`} style={{ animationDelay: `${180 + index * 90}ms` }}>
                  <span className="demo-task-title">{task.title}</span><span className="demo-task-meta"><PriorityDot priority={task.priority} /><span>{task.due}</span></span>
                </button>)}
                {columnTasks.length === 0 && <div className="demo-column-empty">Drop a task here</div>}
              </section>;
            })}
          </div>
        )}

        {view === 'List' && <div className="demo-list">
          {visibleTasks.map((task) => <button type="button" key={task.id} onClick={() => setSelectedTaskId(task.id)} className="demo-list-row">
            <span className="demo-list-check">{task.status === 'Done' ? <CheckCircle2 size={13} /> : <Circle size={13} />}</span><span className="demo-task-title">{task.title}</span><span className={`demo-status-label demo-status-${task.status.toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span><PriorityDot priority={task.priority} /><span className="demo-due">{task.due}</span>
          </button>)}
          {visibleTasks.length === 0 && <p className="demo-empty-state">No sample tasks match these filters.</p>}
        </div>}

        {view === 'Timeline' && <div className="demo-timeline">
          {visibleTasks.map((task, index) => <button type="button" key={task.id} onClick={() => setSelectedTaskId(task.id)} className="demo-timeline-row">
            <span className="demo-timeline-date">{task.due}</span><span className="demo-timeline-track"><span className={`demo-timeline-bar demo-timeline-bar-${index % 4}`} /></span><span className="demo-task-title">{task.title}</span><span className={`demo-status-label demo-status-${task.status.toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span>
          </button>)}
          {visibleTasks.length === 0 && <p className="demo-empty-state">No sample tasks match these filters.</p>}
        </div>}
      </div>

      <div className="demo-assistant-wrap">
        <button type="button" className="demo-assistant-toggle" aria-expanded={assistantOpen} onClick={() => setAssistantOpen((open) => !open)}><Sparkles size={13} /> AI project assistant <span>{assistantOpen ? 'Hide' : 'Open demo'}</span></button>
        <div className={`demo-assistant-card ${assistantOpen ? 'demo-assistant-card-open' : ''}`} aria-hidden={!assistantOpen}>
          <p className="demo-assistant-question">Where did this project stop?</p>
          <div className="demo-assistant-answer"><strong>Sample history reviewed</strong><p>{featureNote} Last session ended after checking the launch list; product screenshots remain a blocker. Suggested next step: finish the checklist while waiting.</p><small>Illustrative response · no AI request sent</small></div>
        </div>
      </div>

      {notificationOpen && <div className="demo-notification" role="status"><span className="demo-notification-icon"><Check size={12} /></span><span><strong>Project update</strong><small>A task is ready for your review.</small></span><button type="button" aria-label="Dismiss notification" onClick={() => setNotificationOpen(false)}><X size={13} /></button></div>}

      {selectedTask && <div className="demo-detail-backdrop" onClick={() => setSelectedTaskId(null)}>
        <aside ref={detailRef} role="dialog" aria-modal="true" aria-label={`Details for ${selectedTask.title}`} className="demo-detail-panel" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[.12em] text-[var(--m-muted)]">Sample task · PH-{String(selectedTask.id).padStart(3, '0')}</p><h4 className="mt-2 text-sm font-semibold">{selectedTask.title}</h4></div><button type="button" className="demo-close-button" aria-label="Close task details" onClick={() => setSelectedTaskId(null)}><X size={14} /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div><label className="demo-detail-label" htmlFor={`demo-status-${instanceId}`}>Status</label><select id={`demo-status-${instanceId}`} className="demo-detail-select" value={selectedTask.status} onChange={(event) => updateStatus(selectedTask.id, event.target.value as DemoStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><div><span className="demo-detail-label">Priority</span><div className="pt-2"><PriorityDot priority={selectedTask.priority} /></div></div></div>
          <div className="mt-4 rounded-md bg-[var(--m-subtle)] p-3"><p className="demo-detail-label">Due date</p><p className="mt-1 text-xs">{selectedTask.due}</p></div>
          {selectedTask.status !== 'Done' && <button type="button" onClick={() => updateStatus(selectedTask.id, 'Done')} className="marketing-button marketing-button-dark mt-5 w-full justify-center">Mark complete <Check size={14} /></button>}
        </aside>
      </div>}
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </div>
  );
}
