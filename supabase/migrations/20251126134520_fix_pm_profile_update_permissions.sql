/*
  # Fix PM Profile Update Permissions

  1. Changes
    - Update profiles RLS policy to allow project managers to update their own profiles
    - Currently only allows users to update own profile OR admins to update any
    - Need to ensure all roles (admin, project_manager, employee) can update their own profiles

  2. Security
    - Users (all roles) can update their own profile
    - Admins can update any profile
    - Project managers can only update their own profile
    - Employees can only update their own profile
*/

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON profiles;

-- Create new UPDATE policy that works for all roles
CREATE POLICY "Users can update own profile or admins can update any"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
