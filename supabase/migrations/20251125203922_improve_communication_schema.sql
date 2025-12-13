/*
  # Improve Communication Schema

  1. Modifications to existing tables
    - Add `is_channel` boolean to messages table to distinguish channels from DMs
    - Add `channel_name` to messages table for channel identification
    - Add `file_url` to messages table for file attachments
    - Add `file_type` to messages table (image, document, voice, etc.)
    - Add `file_name` to messages table
    - Add `is_read` to messages table for read receipts

  2. New Tables
    - `channels` - For managing public channels
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)

    - `channel_members` - For tracking channel memberships
      - `id` (uuid, primary key)
      - `channel_id` (uuid, foreign key to channels)
      - `user_id` (uuid, foreign key to profiles)
      - `joined_at` (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Add policies for channel access
*/

-- Add new columns to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN channel_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view channels"
  ON channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete channels"
  ON channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create channel_members table
CREATE TABLE IF NOT EXISTS channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their channel memberships"
  ON channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join channels"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON channel_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add foreign key for channel_id in messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_channel_id_fkey'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update messages RLS policies for channels
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view direct messages and channel messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid()) OR
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can send direct and channel messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (sender_id = auth.uid() AND receiver_id IS NOT NULL) OR
    (sender_id = auth.uid() AND channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    ))
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
