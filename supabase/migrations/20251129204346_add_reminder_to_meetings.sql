/*
  # Add Email Reminder Fields to Meetings Table

  ## Changes
    - Add `email_reminders` column to meetings table
      - Stores an array of reminder times (e.g., ['30min', '1hour', '2hours', '4hours', '8hours', '24hours'])
      - Multiple reminders can be selected for a single meeting
    
  ## Notes
    - This migration adds the column for storing reminder preferences
    - No edge functions are created for sending reminders
*/

-- Add email_reminders column to meetings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'email_reminders'
  ) THEN
    ALTER TABLE meetings ADD COLUMN email_reminders text[] DEFAULT '{}';
  END IF;
END $$;