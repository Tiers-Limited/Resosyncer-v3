/*
  # Create Public Holidays Table

  1. New Tables
    - `public_holidays`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the holiday
      - `date` (date) - Date of the holiday
      - `created_by` (uuid) - Admin who created this holiday
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `public_holidays` table
    - Add policy for all authenticated users to view holidays
    - Add policy for admins to insert, update, and delete holidays
*/

CREATE TABLE IF NOT EXISTS public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view holidays"
  ON public_holidays
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert holidays"
  ON public_holidays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update holidays"
  ON public_holidays
  FOR UPDATE
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

CREATE POLICY "Admins can delete holidays"
  ON public_holidays
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );