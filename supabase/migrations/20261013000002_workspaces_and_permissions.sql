-- ==============================================================================
-- PROJECTHUB - PHASE 2: WORKSPACES, MEMBERS, ROLES & CUSTOM PERMISSIONS
-- ==============================================================================

-- 1. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'team', 'pro', 'enterprise')),
  max_free_members INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  custom_permissions JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 3. WORKSPACE INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKSPACE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LINK WORKSPACES TO PROJECTS, FILES, AND FOLDERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.files ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'folders' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.folders ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR WORKSPACES
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces" 
ON public.workspaces FOR SELECT 
TO authenticated 
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_members.workspace_id = workspaces.id 
    AND workspace_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces" 
ON public.workspaces FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
CREATE POLICY "Owners can update workspaces" 
ON public.workspaces FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete workspaces" 
ON public.workspaces FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());

-- 8. RLS POLICIES FOR WORKSPACE MEMBERS
DROP POLICY IF EXISTS "Members can view other members in same workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in same workspace" 
ON public.workspace_members FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_members.workspace_id 
    AND (
      workspaces.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_members wm2 
        WHERE wm2.workspace_id = workspace_members.workspace_id 
        AND wm2.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Owners and authorized admins can insert members" ON public.workspace_members;
CREATE POLICY "Owners and authorized admins can insert members" 
ON public.workspace_members FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_members.workspace_id 
    AND workspaces.owner_id = auth.uid()
  ) OR
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Owners can update workspace members" ON public.workspace_members;
CREATE POLICY "Owners can update workspace members" 
ON public.workspace_members FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_members.workspace_id 
    AND workspaces.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete workspace members or members can leave" ON public.workspace_members;
CREATE POLICY "Owners can delete workspace members or members can leave" 
ON public.workspace_members FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_members.workspace_id 
    AND workspaces.owner_id = auth.uid()
  )
);

-- 9. RLS POLICIES FOR INVITATIONS
DROP POLICY IF EXISTS "Members can view workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Members can view workspace invitations" 
ON public.workspace_invitations FOR SELECT 
TO authenticated 
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_invitations.workspace_id 
    AND (
      workspaces.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = workspace_invitations.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Owners and admins can create invitations" ON public.workspace_invitations;
CREATE POLICY "Owners and admins can create invitations" 
ON public.workspace_invitations FOR INSERT 
TO authenticated 
WITH CHECK (
  invited_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_invitations.workspace_id 
    AND (
      workspaces.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = workspace_invitations.workspace_id 
        AND workspace_members.user_id = auth.uid() 
        AND workspace_members.role IN ('owner', 'admin')
      )
    )
  )
);

DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.workspace_invitations;
CREATE POLICY "Owners and admins can update invitations" 
ON public.workspace_invitations FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_invitations.workspace_id 
    AND workspaces.owner_id = auth.uid()
  )
);

-- 10. RLS POLICIES FOR AUDIT LOGS
DROP POLICY IF EXISTS "Workspace members can view audit logs" ON public.workspace_audit_logs;
CREATE POLICY "Workspace members can view audit logs" 
ON public.workspace_audit_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_audit_logs.workspace_id 
    AND (
      workspaces.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = workspace_audit_logs.workspace_id 
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.workspace_audit_logs;
CREATE POLICY "System can insert audit logs" 
ON public.workspace_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (actor_id = auth.uid());

-- 11. UPDATE PROJECTS RLS TO ALLOW WORKSPACE COLLABORATION
DROP POLICY IF EXISTS "Users can view own or workspace projects" ON public.projects;
CREATE POLICY "Users can view own or workspace projects" 
ON public.projects FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_members.workspace_id = projects.workspace_id 
      AND workspace_members.user_id = auth.uid()
    )
  )
);
