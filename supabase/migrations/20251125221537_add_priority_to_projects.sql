/*
  # Add Priority Field to Projects

  1. Changes
    - Add `priority` column to projects table
    - Set default value to 'medium'
    - No constraints on allowed values

  2. Notes
    - Priority can be any text value
    - Common values: low, medium, high, critical
    - Used for Kanban board display
*/

-- Add priority column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'priority'
  ) THEN
    ALTER TABLE projects ADD COLUMN priority text DEFAULT 'medium';
  END IF;
END $$;
