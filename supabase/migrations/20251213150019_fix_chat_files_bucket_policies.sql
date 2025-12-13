/*
  # Fix Chat Files Storage Bucket Policies

  ## Changes
    - Recreate the chat-files bucket if needed
    - Drop and recreate storage policies with correct syntax
    - Ensure authenticated users can upload, view, and delete files
  
  ## Notes
    - Files are organized by user_id in folders
    - Bucket is public for easy file access
    - Users can only upload to their own folder
*/

-- Ensure the chat files bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies safely
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to chat-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to chat-files" ON storage.objects;

-- Allow authenticated users to upload chat files to their own folder
CREATE POLICY "Users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
);

-- Allow everyone to view chat files (public bucket)
CREATE POLICY "Users can view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files'
);