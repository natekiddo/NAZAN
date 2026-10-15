'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkSession } from '@/types';

export interface ActiveTimerData {
  id: string;
  projectId: string;
  projectName: string;
  taskId?: string | null;
  taskTitle?: string | null;
  title: string;
  startTime: string; // ISO string
  accumulatedSeconds: number;
  lastTickTime: number | null; // null if paused
  isPaused: boolean;
}

export interface ModalPrefillData {
  id?: string; // if editing
  projectId?: string;
  taskId?: string | null;
  title?: string;
  startTime?: string;
  endTime?: string;
  durationMins?: number;
  workCompleted?: string;
  problemsEncountered?: string;
  decisionsMade?: string;
  blockers?: string;
  nextAction?: string;
  filesWorkedOn?: string[];
  personalNotes?: string;
  isEditing?: boolean;
}

interface SessionTimerContextType {
  activeSession: ActiveTimerData | null;
  elapsedSeconds: number;
  startTimer: (params: {
    projectId: string;
    projectName: string;
    taskId?: string | null;
    taskTitle?: string | null;
    title?: string;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndRecord: () => void;
  discardTimer: () => void;
  
  // Modal controllers
  isLogModalOpen: boolean;
  modalPrefill: ModalPrefillData | null;
  openLogModal: (prefill?: ModalPrefillData) => void;
  openEditModal: (session: WorkSession & { project?: { name: string } | null; task?: { title: string } | null }) => void;
  closeLogModal: () => void;
  
  // Quick start dialog
  isStartDialogOpen: boolean;
  openStartDialog: (defaultProjectId?: string) => void;
  closeStartDialog: () => void;
  defaultProjectId?: string;
}

const STORAGE_KEY = 'projecthub_active_work_session';

const SessionTimerContext = createContext<SessionTimerContextType | undefined>(undefined);

export function SessionTimerProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveTimerData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<ModalPrefillData | null>(null);

  // Start dialog state
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>(undefined);

  // Load active session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ActiveTimerData = JSON.parse(saved);
        setActiveSession(parsed);
      }
    } catch (e) {
      console.error('Failed to restore active session', e);
    }
  }, []);

  // Update timer tick & sync to localStorage
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }

    const calculateCurrentElapsed = () => {
      let seconds = activeSession.accumulatedSeconds;
      if (!activeSession.isPaused && activeSession.lastTickTime) {
        const delta = Math.floor((Date.now() - activeSession.lastTickTime) / 1000);
        seconds += Math.max(0, delta);
      }
      return seconds;
    };

    setElapsedSeconds(calculateCurrentElapsed());

    if (activeSession.isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(calculateCurrentElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const saveToStorage = (data: ActiveTimerData | null) => {
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync to storage', e);
    }
  };

  const startTimer = useCallback(
    ({
      projectId,
      projectName,
      taskId,
      taskTitle,
      title,
    }: {
      projectId: string;
      projectName: string;
      taskId?: string | null;
      taskTitle?: string | null;
      title?: string;
    }) => {
      const newSession: ActiveTimerData = {
        id: crypto.randomUUID(),
        projectId,
        projectName,
        taskId: taskId || null,
        taskTitle: taskTitle || null,
        title: title || `Work Session: ${projectName}`,
        startTime: new Date().toISOString(),
        accumulatedSeconds: 0,
        lastTickTime: Date.now(),
        isPaused: false,
      };

      setActiveSession(newSession);
      saveToStorage(newSession);
      setIsStartDialogOpen(false);
    },
    []
  );

  const pauseTimer = useCallback(() => {
    if (!activeSession || activeSession.isPaused) return;

    const delta = activeSession.lastTickTime
      ? Math.floor((Date.now() - activeSession.lastTickTime) / 1000)
      : 0;

    const updated: ActiveTimerData = {
      ...activeSession,
      accumulatedSeconds: activeSession.accumulatedSeconds + Math.max(0, delta),
      lastTickTime: null,
      isPaused: true,
    };

    setActiveSession(updated);
    saveToStorage(updated);
  }, [activeSession]);

  const resumeTimer = useCallback(() => {
    if (!activeSession || !activeSession.isPaused) return;

    const updated: ActiveTimerData = {
      ...activeSession,
      lastTickTime: Date.now(),
      isPaused: false,
    };

    setActiveSession(updated);
    saveToStorage(updated);
  }, [activeSession]);

  const stopAndRecord = useCallback(() => {
    if (!activeSession) return;

    let totalSeconds = activeSession.accumulatedSeconds;
    if (!activeSession.isPaused && activeSession.lastTickTime) {
      totalSeconds += Math.floor((Date.now() - activeSession.lastTickTime) / 1000);
    }

    const durationMins = Math.max(1, Math.round(totalSeconds / 60));

    setModalPrefill({
      projectId: activeSession.projectId,
      taskId: activeSession.taskId,
      title: activeSession.title,
      startTime: activeSession.startTime,
      endTime: new Date().toISOString(),
      durationMins,
      isEditing: false,
    });

    setIsLogModalOpen(true);
  }, [activeSession]);

  const discardTimer = useCallback(() => {
    if (confirm('Are you sure you want to discard this live timer? Tracked time will be lost.')) {
      setActiveSession(null);
      saveToStorage(null);
      setElapsedSeconds(0);
    }
  }, []);

  const openLogModal = useCallback((prefill?: ModalPrefillData) => {
    setModalPrefill(prefill || null);
    setIsLogModalOpen(true);
  }, []);

  const openEditModal = useCallback(
    (session: WorkSession & { project?: { name: string } | null; task?: { title: string } | null }) => {
      setModalPrefill({
        id: session.id,
        projectId: session.project_id,
        taskId: session.task_id,
        title: session.title,
        startTime: session.start_time,
        endTime: session.end_time || undefined,
        durationMins: session.duration_mins,
        workCompleted: session.work_completed || '',
        problemsEncountered: session.problems_encountered || '',
        decisionsMade: session.decisions_made || '',
        blockers: session.blockers || '',
        nextAction: session.next_action || '',
        filesWorkedOn: session.files_worked_on || [],
        personalNotes: session.personal_notes || '',
        isEditing: true,
      });
      setIsLogModalOpen(true);
    },
    []
  );

  const closeLogModal = useCallback(() => {
    setIsLogModalOpen(false);
    setModalPrefill(null);
  }, []);

  const openStartDialog = useCallback((defaultProjId?: string) => {
    setDefaultProjectId(defaultProjId);
    setIsStartDialogOpen(true);
  }, []);

  const closeStartDialog = useCallback(() => {
    setIsStartDialogOpen(false);
    setDefaultProjectId(undefined);
  }, []);

  return (
    <SessionTimerContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndRecord,
        discardTimer,
        isLogModalOpen,
        modalPrefill,
        openLogModal,
        openEditModal,
        closeLogModal,
        isStartDialogOpen,
        openStartDialog,
        closeStartDialog,
        defaultProjectId,
      }}
    >
      {children}
    </SessionTimerContext.Provider>
  );
}

export function useSessionTimer() {
  const context = useContext(SessionTimerContext);
  if (!context) {
    throw new Error('useSessionTimer must be used within a SessionTimerProvider');
  }
  return context;
}
