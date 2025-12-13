/*
  # Fix Profiles Update Policy for Admins

  1. Changes
    - Drop existing UPDATE policy that only allows self-update
    - Create new UPDATE policy that allows:
      - Users to update their own profile
      - Admins to update any profile

  2. Security
    - Maintains user privacy (users can only update their own)
    - Allows admins to manage employee profiles
    - Uses proper authentication checks
*/

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new UPDATE policy allowing admin access
CREATE POLICY "Users can update own profile or admins can update any"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
