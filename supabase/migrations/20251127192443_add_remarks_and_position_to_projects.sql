/*
  # Add Remarks and Position to Projects

  1. Changes
    - Add 'remarks' text column to projects table
    - Add 'position' integer column to projects table for custom ordering
  
  2. Notes
    - Remarks will store additional notes about projects
    - Position allows drag-and-drop reordering of projects
    - Default position is set based on existing project count
*/

-- Add remarks column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'remarks'
  ) THEN
    ALTER TABLE projects ADD COLUMN remarks text;
  END IF;
END $$;

-- Add position column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'position'
  ) THEN
    ALTER TABLE projects ADD COLUMN position integer DEFAULT 0;
    
    -- Set initial positions based on created_at
    WITH ordered_projects AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
      FROM projects
    )
    UPDATE projects
    SET position = ordered_projects.row_num
    FROM ordered_projects
    WHERE projects.id = ordered_projects.id;
  END IF;
END $$;