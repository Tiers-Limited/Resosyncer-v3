/*
  # Add Attendees to Meetings Table

  ## Changes
    - Add `attendee_type` column to meetings table
      - Values: 'individual' (only for creator) or 'multiple' (for selected users)
    - Add `attendee_ids` column to meetings table
      - Array of user IDs who should see this meeting
      - Empty array means only creator can see it
    
  ## Notes
    - Meetings will be filtered based on attendees in the application
    - If attendee_type is 'individual', only the creator sees the meeting
    - If attendee_type is 'multiple', all users in attendee_ids array can see it
*/

-- Add attendee_type and attendee_ids columns to meetings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendee_type'
  ) THEN
    ALTER TABLE meetings ADD COLUMN attendee_type text DEFAULT 'individual';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendee_ids'
  ) THEN
    ALTER TABLE meetings ADD COLUMN attendee_ids uuid[] DEFAULT '{}';
  END IF;
END $$;