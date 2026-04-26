/*
  # Allow PMs to read active employee time logs for their own projects

  Problem:
  - PM dashboard queries `time_logs` for assigned employees.
  - Existing RLS on `time_logs` allows only:
    1) the log owner
    2) admins
  - Result: PMs cannot see active employees even when assignments are correct.

  Fix:
  - Add a SELECT policy so project managers can read `time_logs`
    for employees assigned to projects where they are the project manager.
*/

DROP POLICY IF EXISTS "Project managers can view assigned employee time logs" ON time_logs;

CREATE POLICY "Project managers can view assigned employee time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles pm
      WHERE pm.id = auth.uid()
      AND pm.role = 'project_manager'
    )
    AND EXISTS (
      SELECT 1
      FROM project_assignees pa
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.employee_id = time_logs.user_id
      AND p.project_manager_id = auth.uid()
    )
  );

