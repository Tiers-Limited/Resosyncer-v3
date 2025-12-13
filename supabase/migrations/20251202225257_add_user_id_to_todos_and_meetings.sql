/*
  # Add User ID to Todos and Meetings Tables

  ## Changes
    - Add `user_id` column to todos table for user ownership
    - Add `user_id` column to meetings table for user ownership
    - Each admin will have their own to-do list and meetings
  
  ## Notes
    - Todos and meetings are now user-specific
    - When filtering, each admin only sees their own items
    - Existing items will have NULL user_id (requires manual assignment or deletion)
*/

-- Add user_id to todos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to meetings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;