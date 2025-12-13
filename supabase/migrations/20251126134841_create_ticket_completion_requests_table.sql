/*
  # Create Ticket Completion Requests Table

  1. New Tables
    - `ticket_completion_requests`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references tickets)
      - `requested_by` (uuid, references profiles) - Employee who requests completion
      - `requested_at` (timestamp)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `reviewed_by` (uuid, references profiles) - PM who reviews
      - `reviewed_at` (timestamp)
      - `review_notes` (text) - Notes from PM

  2. Security
    - Enable RLS on `ticket_completion_requests` table
    - Authenticated users can view completion requests for tickets they have access to
    - Employees can create completion requests for their assigned tickets
    - PMs can update (approve/reject) completion requests for their project tickets
*/

-- Create ticket_completion_requests table
CREATE TABLE IF NOT EXISTS ticket_completion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  requested_by uuid REFERENCES profiles(id) NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ticket_completion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view completion requests for tickets they have access to
CREATE POLICY "Users can view completion requests for accessible tickets"
  ON ticket_completion_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ticket_completion_requests.ticket_id
      AND (
        t.assigned_to = auth.uid() OR
        t.created_by = auth.uid() OR
        p.project_manager_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Policy: Employees can create completion requests for their assigned tickets
CREATE POLICY "Employees can create completion requests for assigned tickets"
  ON ticket_completion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requested_by AND
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_completion_requests.ticket_id
      AND assigned_to = auth.uid()
    )
  );

-- Policy: PMs and admins can update completion requests
CREATE POLICY "PMs and admins can update completion requests"
  ON ticket_completion_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ticket_completion_requests.ticket_id
      AND (
        p.project_manager_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ticket_completion_requests.ticket_id
      AND (
        p.project_manager_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_completion_requests_ticket_id ON ticket_completion_requests(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_completion_requests_status ON ticket_completion_requests(status);
