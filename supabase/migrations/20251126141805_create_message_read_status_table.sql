/*
  # Create Message Read Status Table

  1. New Tables
    - `message_read_status`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `user_id` (uuid, references profiles)
      - `read_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Changes
    - Tracks read status per user for channel messages
    - Unique constraint on (message_id, user_id) to prevent duplicates
  
  3. Security
    - Enable RLS
    - Users can read their own read status
    - Users can insert their own read status
*/

-- Create message_read_status table
CREATE TABLE IF NOT EXISTS message_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view own read status"
  ON message_read_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own read status
CREATE POLICY "Users can insert own read status"
  ON message_read_status
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);