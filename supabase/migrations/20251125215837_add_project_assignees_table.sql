/*
  # Add Project Assignees Table

  1. New Tables
    - `project_assignees`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `employee_id` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to profiles)
  
  2. Security
    - Enable RLS on `project_assignees` table
    - Add policies for authenticated users to view project assignments
    - Add policies for admins and project managers to manage assignments

  3. Notes
    - This allows multiple employees to be assigned to a project
    - Separate from project_manager_id which is for the PM only
*/

-- Create project_assignees table
CREATE TABLE IF NOT EXISTS project_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  UNIQUE(project_id, employee_id)
);

-- Enable RLS
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view project assignments
CREATE POLICY "Authenticated users can view project assignments"
  ON project_assignees FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins and PMs can insert project assignments
CREATE POLICY "Admins and PMs can insert assignments"
  ON project_assignees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

-- Policy: Admins and PMs can delete project assignments
CREATE POLICY "Admins and PMs can delete assignments"
  ON project_assignees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignees_employee_id ON project_assignees(employee_id);
