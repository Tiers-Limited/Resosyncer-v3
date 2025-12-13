/*
  # Fix Profiles Delete Policy for Admins

  1. Changes
    - Drop existing DELETE policy that blocks all deletes
    - Create new DELETE policy that allows:
      - Admins to delete profiles (except their own)

  2. Security
    - Regular users still cannot delete profiles
    - Admins can manage employees
    - Admins cannot delete their own account (safety measure)
*/

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Prevent profile deletion" ON profiles;

-- Create new DELETE policy allowing admin access
CREATE POLICY "Admins can delete other profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' 
    AND profiles.id != auth.uid()
  );
