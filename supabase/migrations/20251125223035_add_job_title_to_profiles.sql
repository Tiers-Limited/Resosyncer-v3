/*
  # Add job_title Column to Profiles

  1. Changes
    - Add `job_title` column to `profiles` table
    - This column stores the employee's job position/title

  2. Notes
    - Used in letter generation and employee management
    - Optional field, can be null
*/

-- Add job_title to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;
END $$;
