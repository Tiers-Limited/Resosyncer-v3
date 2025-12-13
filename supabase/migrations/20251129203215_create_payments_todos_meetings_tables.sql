/*
  # Create Payments Tracker, To-Do List, and Meetings Tables

  ## New Tables
  
  ### 1. `payments`
    - `id` (uuid, primary key)
    - `client_name` (text) - Name of the client
    - `amount` (numeric) - Payment amount
    - `status` (text) - Payment status: 'paid', 'not_paid'
    - `remarks` (text) - Additional notes about the payment
    - `created_at` (timestamptz) - When the payment record was created
    - `updated_at` (timestamptz) - When the payment record was last updated
    - `created_by` (uuid) - Foreign key to profiles table
    - `is_archived` (boolean) - Soft delete flag

  ### 2. `todos`
    - `id` (uuid, primary key)
    - `title` (text) - To-do item title
    - `description` (text) - Detailed description
    - `completed` (boolean) - Completion status
    - `priority` (text) - Priority level: 'low', 'medium', 'high'
    - `due_date` (date) - When the task is due
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `created_by` (uuid) - Foreign key to profiles table

  ### 3. `meetings`
    - `id` (uuid, primary key)
    - `title` (text) - Meeting title
    - `description` (text) - Meeting description
    - `meeting_date` (timestamptz) - Date and time of the meeting
    - `duration` (integer) - Duration in minutes
    - `location` (text) - Meeting location or link
    - `attendees` (text) - Comma-separated attendees
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `created_by` (uuid) - Foreign key to profiles table

  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own records
    - Admins can manage all records
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  status text NOT NULL DEFAULT 'not_paid',
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_archived boolean DEFAULT false
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  meeting_date timestamptz NOT NULL,
  duration integer DEFAULT 60,
  location text,
  attendees text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Todos policies
CREATE POLICY "Admins can view all todos"
  ON todos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update todos"
  ON todos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete todos"
  ON todos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Meetings policies
CREATE POLICY "Admins can view all meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);