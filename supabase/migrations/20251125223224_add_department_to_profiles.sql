/*
  # Add department Column to Profiles

  1. Changes
    - Add `department` column to `profiles` table
    - This column stores the employee's department/team

  2. Notes
    - Used in letter generation and employee management
    - Optional field, can be null
*/

-- Add department to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department text;
  END IF;
END $$;
