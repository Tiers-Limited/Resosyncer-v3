/*
  # Fix Attendance Update Policy for Admins

  1. Changes
    - Drop existing attendance update policy
    - Create new policy allowing:
      - Users to update their own attendance
      - Admins to update any attendance record
  
  2. Security
    - Maintains user data ownership
    - Grants admin override capability for manual attendance management
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;

-- Create new policy allowing users to update own records and admins to update any
CREATE POLICY "Users and admins can update attendance"
  ON attendance
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );