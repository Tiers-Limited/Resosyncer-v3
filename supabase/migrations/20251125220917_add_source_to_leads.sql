/*
  # Add Source Column to Leads

  1. Changes
    - Add `source` column to leads table
    - Set default value to 'website'
    - No constraints on allowed values
    - Remove status constraint if exists

  2. Notes
    - Source can be any text value
    - Common values: website, referral, social_media, cold_call, email, fiverr, upwork, whatsapp, other
    - Status field also has no constraints
*/

-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads ADD COLUMN source text DEFAULT 'website';
  END IF;
END $$;

-- Drop any existing status constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Drop any existing source constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
