/*
  # Create Documents Storage Bucket

  1. New Storage Bucket
    - Create 'documents' bucket for file uploads
    - Set to private (requires authentication)
    - Maximum file size: 50MB
  
  2. Storage Policies
    - Authenticated users can upload files
    - Authenticated users can view files
    - Users can delete their own files or admins can delete any
    - Users can update their own files or admins can update any

  3. Security
    - All operations require authentication
    - Files are private by default
    - Proper access control through RLS-like policies
*/

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed'
  ]
);

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Authenticated users can view files
CREATE POLICY "Authenticated users can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Users can delete own files or admins can delete any
CREATE POLICY "Users can delete own files or admins can delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- Policy: Users can update own files or admins can update any
CREATE POLICY "Users can update own files or admins can update any"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);
