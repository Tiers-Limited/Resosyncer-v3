/*
  # Fix Profiles Insert Policy for Admin

  1. Changes
    - Drop existing insert policy that only allows users to create their own profile
    - Create new insert policy that allows:
      - Users to create their own profile on signup
      - Admins to create profiles for other users (when adding employees)
  
  2. Security
    - Maintains RLS protection
    - Users can still create their own profiles during signup
    - Only admins can create profiles for other users
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

-- Create new insert policy that allows both self-creation and admin creation
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = id) OR 
    (
      SELECT role 
      FROM profiles 
      WHERE id = auth.uid()
    ) = 'admin'
  );
