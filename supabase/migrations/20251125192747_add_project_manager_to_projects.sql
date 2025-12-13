/*
  # Add Project Manager to Projects

  1. Changes
    - Add `project_manager_id` column to `projects` table
    - Add foreign key reference to `profiles` table
    - Update existing projects to set project_manager_id to null (can be assigned later)

  2. Security
    - No RLS changes needed (inherits existing project policies)
*/

-- Add project_manager_id column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_manager_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id ON projects(project_manager_id);
