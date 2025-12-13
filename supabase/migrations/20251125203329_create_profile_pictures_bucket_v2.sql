/*
  # Create Profile Pictures Storage Bucket

  1. Storage
    - Create 'profile-pictures' bucket for storing user profile pictures
    - Set up public access for profile pictures
    - Configure RLS policies for bucket access

  2. Security
    - Users can upload their own profile pictures
    - Users can view all profile pictures (public access)
    - Users can update their own profile pictures
    - Users can delete their own profile pictures
*/

-- Create the profile pictures bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own profile picture" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view profile pictures (public bucket)
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
