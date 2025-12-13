/*
  # Add Archive Fields

  1. Modifications
    - Add `archived` column to leads table
    - Add `archived` column to projects table
    - Add `suspended` column to profiles table

  2. Notes
    - Default values are FALSE for all new columns
    - Suspended users cannot login
*/

-- Add archived column to leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'archived'
  ) THEN
    ALTER TABLE leads ADD COLUMN archived boolean DEFAULT false;
  END IF;
END $$;

-- Add archived column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'archived'
  ) THEN
    ALTER TABLE projects ADD COLUMN archived boolean DEFAULT false;
  END IF;
END $$;

-- Add suspended column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended boolean DEFAULT false;
  END IF;
END $$;
