/*
  # Update Attendance Table for Time Tracking

  1. Changes
    - Add `standup_message` column to attendance table
    - Attendance table will be used as daily summary
    - time_logs table will track individual work sessions
    - User can have multiple time_logs per day, summed up in attendance

  2. Notes
    - time_logs table already exists with proper columns
    - Attendance table will be updated with daily summary when user stops timer
*/

-- Add standup_message column to attendance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'standup_message'
  ) THEN
    ALTER TABLE attendance ADD COLUMN standup_message text;
  END IF;
END $$;

-- Add unique constraint on user_id and date to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_user_id_date_key'
  ) THEN
    ALTER TABLE attendance ADD CONSTRAINT attendance_user_id_date_key UNIQUE (user_id, date);
  END IF;
END $$;
