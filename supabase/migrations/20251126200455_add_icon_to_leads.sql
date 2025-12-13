/*
  # Add Icon Field to Leads

  1. Changes
    - Add 'icon' column to leads table to store icon selection
    - Icon will be stored as text (emoji or icon identifier)
    - Default to empty string

  2. Notes
    - Allows admins to customize lead appearance with icons
*/

-- Add icon column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'icon'
  ) THEN
    ALTER TABLE leads ADD COLUMN icon text DEFAULT '';
  END IF;
END $$;