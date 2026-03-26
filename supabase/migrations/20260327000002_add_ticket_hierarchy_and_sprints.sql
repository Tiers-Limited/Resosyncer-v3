-- Add Jira-like hierarchy to tickets system
-- Migration: 20260327000002_add_ticket_hierarchy_and_sprints.sql

-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date date,
  end_date date,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add hierarchy columns to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type text DEFAULT 'task' CHECK (ticket_type IN ('epic', 'story', 'task', 'bug', 'subtask'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES tickets(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS story_points integer DEFAULT 0 CHECK (story_points >= 0 AND story_points <= 21);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_parent_id ON tickets(parent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sprint_id ON tickets(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);

-- Enable RLS on sprints
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Sprints policies
CREATE POLICY "Users can view sprints for their projects"
  ON sprints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sprints.project_id
      AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles pr
          WHERE pr.id = auth.uid()
          AND pr.role IN ('admin', 'project_manager')
        ) OR
        EXISTS (
          SELECT 1 FROM project_employees pe
          WHERE pe.project_id = p.id AND pe.employee_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "PMs and admins can manage sprints"
  ON sprints FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

-- Update tickets policies to include hierarchy considerations
DROP POLICY IF EXISTS "Users can view assigned tickets" ON tickets;
DROP POLICY IF EXISTS "PMs and admins can insert tickets" ON tickets;
DROP POLICY IF EXISTS "PMs and admins can update tickets" ON tickets;
DROP POLICY IF EXISTS "Assigned users can update ticket status" ON tickets;

CREATE POLICY "Users can view relevant tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    ) OR
    EXISTS (
      SELECT 1 FROM project_employees pe
      WHERE pe.project_id = tickets.project_id AND pe.employee_id = auth.uid()
    )
  );

CREATE POLICY "PMs and admins can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "PMs and admins can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Assigned users can update ticket status"
  ON tickets FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (
    assigned_to = auth.uid() AND
    -- Only allow status updates, not other fields
    OLD.title = NEW.title AND
    OLD.description = NEW.description AND
    OLD.priority = NEW.priority AND
    OLD.ticket_type = NEW.ticket_type AND
    OLD.parent_id = NEW.parent_id AND
    OLD.sprint_id = NEW.sprint_id
  );

-- Create ticket-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ticket attachments
CREATE POLICY "Users can view ticket attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can update ticket attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can delete ticket attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ticket-attachments');