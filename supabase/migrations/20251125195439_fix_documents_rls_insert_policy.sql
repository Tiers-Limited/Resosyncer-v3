/*
  # Fix Documents RLS Insert Policy

  1. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows:
      - Documents where uploaded_by matches auth.uid()
      - Documents where uploaded_by is null (for system-created folders)
      - Documents created by authenticated users

  2. Security
    - Maintains security by requiring authentication
    - Allows flexibility for null uploaded_by values
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;

-- Create new INSERT policy with more flexible rules
CREATE POLICY "Authenticated users can create documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by IS NULL OR uploaded_by = auth.uid()
  );
