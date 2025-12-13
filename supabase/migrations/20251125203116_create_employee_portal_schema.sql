/*
  # Employee Portal Schema

  1. New Tables
    - `time_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `total_hours` (numeric)
      - `standup_message` (text, nullable)
      - `status` (text: active, paused, completed)
      - `created_at` (timestamptz)

    - `tickets`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `assigned_to` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `priority` (text: low, medium, high, urgent)
      - `status` (text: todo, in_progress, review, completed)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ticket_comments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to tickets)
      - `user_id` (uuid, foreign key to profiles)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Modifications to existing tables
    - Add `profile_picture_url` to profiles table
    - Add `bio` to profiles table

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for PMs to manage tickets
*/

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  start_time timestamptz,
  end_time timestamptz,
  total_hours numeric DEFAULT 0,
  standup_message text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time logs"
  ON time_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time logs"
  ON time_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
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
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "PMs and admins can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.assigned_to = auth.uid() OR tickets.created_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Users can insert comments on their tickets"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_comments.ticket_id
        AND (tickets.assigned_to = auth.uid() OR tickets.created_by = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'project_manager')
      )
    )
  );

-- Add profile picture and bio to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
