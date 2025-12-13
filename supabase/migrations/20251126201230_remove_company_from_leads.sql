/*
  # Remove Company Column from Leads

  1. Changes
    - Drop 'company' column from leads table if it exists

  2. Notes
    - This is a destructive operation but data is no longer needed
    - Company information has been moved to a different schema
*/

-- Drop company column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'company'
  ) THEN
    ALTER TABLE leads DROP COLUMN company;
  END IF;
END $$;