/*
  # Add Recording Fields to Meetings Table

  ## New Columns

  ### 1. `recording_url` (text)
    - URL to the meeting recording stored in Supabase storage
    - Nullable field

  ### 2. `has_recording` (boolean)
    - Flag to indicate if the meeting has a recording available
    - Defaults to false
    - Used for quick filtering and UI display

  ## Security
    - Inherits existing RLS policies from meetings table
*/

-- Add recording fields to meetings table
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS recording_url text,
ADD COLUMN IF NOT EXISTS has_recording boolean DEFAULT false;

-- Create index for better performance when filtering by recordings
CREATE INDEX IF NOT EXISTS idx_meetings_has_recording ON meetings(has_recording);