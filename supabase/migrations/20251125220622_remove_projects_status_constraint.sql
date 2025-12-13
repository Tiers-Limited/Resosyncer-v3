/*
  # Remove Status Check Constraint from Projects

  1. Changes
    - Drop the `projects_status_check` constraint from projects table
    - This allows any status value to be added to projects
    - Provides flexibility for custom status values

  2. Notes
    - The status field remains as text type
    - No restrictions on what status values can be used
    - Application can handle status validation if needed
*/

-- Drop the status check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
