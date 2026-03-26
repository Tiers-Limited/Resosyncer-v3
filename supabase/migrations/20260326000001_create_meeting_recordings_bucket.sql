/*
  # Create Meeting Recordings Storage Bucket

  1. New Storage Bucket
    - Create 'meeting-recordings' bucket for meeting video/audio uploads
    - Set to private (requires authentication)
    - Maximum file size: 500MB (suitable for video recordings)

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

-- Create the meeting-recordings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-recordings',
  'meeting-recordings',
  false,
  524288000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/mp4',
    'audio/ogg',
    'audio/flac'
  ]
);

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload meeting recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Authenticated users can view files
CREATE POLICY "Authenticated users can view meeting recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-recordings');

-- Policy: Users can delete own files or admins can delete any
CREATE POLICY "Users can delete own meeting recordings or admins can delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- Policy: Users can update own files or admins can update any
CREATE POLICY "Users can update own meeting recordings or admins can update any"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
);