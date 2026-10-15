-- Raise the project-files bucket limit so typical documents and zips can upload.
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'project-files';
