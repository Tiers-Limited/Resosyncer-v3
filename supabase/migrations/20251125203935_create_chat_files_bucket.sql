/*
  # Create Chat Files Storage Bucket

  1. Storage
    - Create 'chat-files' bucket for storing chat attachments and voice messages
    - Set up public access

  2. Security
    - Users can upload files
    - Users can view all files in their conversations
*/

-- Create the chat files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow authenticated users to upload chat files
CREATE POLICY "Users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view chat files
CREATE POLICY "Users can view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
