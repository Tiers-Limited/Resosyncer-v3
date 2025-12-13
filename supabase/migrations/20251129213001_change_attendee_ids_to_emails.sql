/*
  # Change Meeting Attendees from IDs to Emails

  ## Changes
    - Drop the `attendee_ids` column (which stored user IDs)
    - Add `attendee_emails` column to store email addresses
    - This allows meetings to reference attendees by email instead of UUID
  
  ## Notes
    - Emails are more flexible and human-readable
    - Attendees will be filtered by matching their email addresses
*/

-- Remove the old attendee_ids column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendee_ids'
  ) THEN
    ALTER TABLE meetings DROP COLUMN attendee_ids;
  END IF;
END $$;

-- Add the new attendee_emails column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendee_emails'
  ) THEN
    ALTER TABLE meetings ADD COLUMN attendee_emails text[] DEFAULT '{}';
  END IF;
END $$;