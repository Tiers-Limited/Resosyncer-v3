/*
  # Add is_archived Column to Projects and Leads

  1. Changes
    - Add `is_archived` column to `projects` table with default false
    - Add `is_archived` column to `leads` table with default false
    - Drop old `archived` column if it exists

  2. Notes
    - This column is used to soft-delete records
    - Archived records are hidden from main views but can be restored
*/

-- Add is_archived to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE projects ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Add is_archived to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE leads ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Drop old archived column from projects if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'archived'
  ) THEN
    ALTER TABLE projects DROP COLUMN archived;
  END IF;
END $$;

-- Drop old archived column from leads if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'archived'
  ) THEN
    ALTER TABLE leads DROP COLUMN archived;
  END IF;
END $$;
