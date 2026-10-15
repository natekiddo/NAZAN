'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Users,
  Settings,
  Plus,
  Loader2,
  Sparkles,
  Maximize2,
  Volume2,
  FolderGit2,
  Radio,
} from 'lucide-react';
import { Workspace, Project, CallSessionItem } from '@/types';
import {
  startWorkspaceCallAction,
  endWorkspaceCallAction,
  getWorkspaceActiveCalls,
} from '@/lib/actions/calls';

interface VideoCallRoomProps {
  workspace: Workspace;
  projects: Project[];
  activeCalls: CallSessionItem[];
  currentUser: { id: string; name: string; email: string };
}

export default function VideoCallRoom({
  workspace,
  projects,
  activeCalls: initialActiveCalls,
  currentUser,
}: VideoCallRoomProps) {
  const [activeCalls, setActiveCalls] = useState<CallSessionItem[]>(initialActiveCalls);
  const [currentCall, setCurrentCall] = useState<CallSessionItem | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isStartingCall, setIsStartingCall] = useState(false);

  // In-call state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Request user camera and microphone when entering a call
  useEffect(() => {
    if (!currentCall) {
      // Clean up existing stream when not in call
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initMedia() {
      try {
        setMediaError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err: any) {
        console.warn('Could not access media devices:', err);
        setMediaError(
          'Camera or microphone access denied or not available. Running in audio-ready avatar mode.'
        );
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [currentCall]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn(!isVideoOn);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Switch back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(false);
      } catch {}
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          localStreamRef.current = screenStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);

          screenStream.getVideoTracks()[0].onended = () => {
            toggleScreenShare();
          };
        }
      } catch (err) {
        console.warn('Screen share canceled or failed', err);
      }
    }
  };

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStartingCall(true);

    try {
      const res = await startWorkspaceCallAction(
        workspace.id,
        meetingTitle.trim() || 'Workspace Team Standup',
        selectedProjectId || null
      );

      if (res.call) {
        setCurrentCall(res.call);
        setActiveCalls((prev) => [res.call!, ...prev]);
        setMeetingTitle('');
      } else if (res.error) {
        alert(res.error);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to start call');
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleEndCall = async () => {
    if (currentCall) {
      await endWorkspaceCallAction(currentCall.id);
      setActiveCalls((prev) => prev.filter((c) => c.id !== currentCall.id));
      setCurrentCall(null);
    }
  };

  const handleJoinCall = (call: CallSessionItem) => {
    setCurrentCall(call);
  };

  return (
    <div className="space-y-6">
      {/* If inside active call */}
      {currentCall ? (
        <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-300">
          {/* Call Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  {currentCall.title}
                  {currentCall.project?.name && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentCall.project.name}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Host: {currentCall.host?.full_name || 'Team Lead'} • Workspace: {workspace.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Live Mesh Room
              </span>
            </div>
          </div>

          {/* Media Notification */}
          {mediaError && (
            <div className="px-6 py-2 bg-amber-950/60 border-b border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
              <span>{mediaError}</span>
            </div>
          )}

          {/* Video Grid Stage */}
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto items-center justify-center bg-slate-950/90">
            {/* Local Video Tile */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex items-center justify-center group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoOn || mediaError ? 'hidden' : ''}`}
              />

              {(!isVideoOn || mediaError) && (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    {currentUser.name} (Camera Off)
                  </span>
                </div>
              )}

              {/* Tile Overlay Badge */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
                <span>{currentUser.name} (You)</span>
                {!isMicOn && <MicOff className="w-3 h-3 text-rose-400" />}
              </div>
            </div>

            {/* Teammate Video Tile */}
            <div className="relative aspect-video bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-lg">
                <Users className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">
                  Waiting for Teammates to Join...
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Teammates in this workspace can join this call anytime from the Voice &amp; Video dashboard tab.
                </p>
              </div>
            </div>
          </div>

          {/* Call Controls Bar */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                isMicOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                isVideoOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
              }`}
              title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Share Screen"
            >
              <ScreenShare className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer ml-4"
            >
              <PhoneOff className="w-4 h-4" />
              Leave Call
            </button>
          </div>
        </div>
      ) : (
        /* Call Dashboard Launcher */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Start New Call */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-500" />
                Start Video Meeting
              </h3>
              <p className="text-xs text-slate-500">
                Instantly launch an encrypted meeting room for your workspace.
              </p>
            </div>

            <form onSubmit={handleStartCall} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Topic / Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Sprint Review &amp; Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach to Project (Optional)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">General Workspace Meeting</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isStartingCall}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isStartingCall ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                Launch Meeting Room
              </button>
            </form>
          </div>

          {/* Column 2 & 3: Active Calls & Collaboration Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Active Workspace Rooms
                  </h4>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {activeCalls.length} live
                </span>
              </div>

              {activeCalls.length === 0 ? (
                <div className="py-12 text-center space-y-3 text-slate-400">
                  <Video className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <h5 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                    No active calls in this workspace
                  </h5>
                  <p className="text-xs max-w-sm mx-auto">
                    Start a quick meeting using the panel on the left to discuss blockers, review code, or align on sprints.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCalls.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {call.title}
                          </h4>
                          {call.project?.name && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              {call.project.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Started {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {call.host?.full_name || 'Host'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleJoinCall(call)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Join Call
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
