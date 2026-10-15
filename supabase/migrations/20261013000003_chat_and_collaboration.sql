-- ==============================================================================
-- PROJECTHUB — COLLABORATION, CHAT, CALLS, AND DRIVE FOLDERS MIGRATION
-- ==============================================================================

-- 1. Add Google Drive Folder columns to projects if not exists
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_folder_name TEXT;

-- 2. CREATE CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace ON public.chat_messages(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON public.chat_messages(project_id, created_at DESC);

-- 3. CREATE CALL_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_workspace ON public.call_sessions(workspace_id, created_at DESC);

-- 4. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Chat messages policy: workspace members can view messages
CREATE POLICY "Workspace members can view chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = chat_messages.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Chat messages policy: workspace members can insert messages
CREATE POLICY "Workspace members can post chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = chat_messages.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Call sessions policy: workspace members can view active calls
CREATE POLICY "Workspace members can view call sessions"
  ON public.call_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = call_sessions.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Call sessions policy: workspace members can create/update call sessions
CREATE POLICY "Workspace members can create call sessions"
  ON public.call_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = host_user_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = call_sessions.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Host can update call session"
  ON public.call_sessions FOR UPDATE
  USING (
    auth.uid() = host_user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = call_sessions.workspace_id
      AND wm.user_id = auth.uid()
    )
  );
