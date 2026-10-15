-- ==============================================================================
-- PROJECTHUB - SUPABASE STORAGE CONFIGURATION & POLICIES
-- ==============================================================================

-- 1. Create Private Storage Bucket for Project Files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800, -- 50 MB file limit
  NULL      -- Allow any file type (documents, code, zip, images, etc.)
)
ON CONFLICT (id) DO UPDATE 
SET public = false, file_size_limit = 52428800;

-- 2. Storage RLS Policies
-- Objects are organized by User ID at the root path: <user_id>/<file_id>/<filename>

DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
CREATE POLICY "Authenticated users can upload project files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read own project files" ON storage.objects;
CREATE POLICY "Users can read own project files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own project files" ON storage.objects;
CREATE POLICY "Users can update own project files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;
CREATE POLICY "Users can delete own project files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
