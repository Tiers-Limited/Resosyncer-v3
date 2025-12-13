/*
  # Add Closing Percentage Column to Leads

  ## Changes
    - Add `closing_percentage` column to leads table
    - Stores the possibility/probability of closing the lead (0-100%)
    - Default value is 0
  
  ## Notes
    - This helps track the likelihood of converting a lead
    - Values range from 0 to 100 representing percentage
*/

-- Add closing_percentage column to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'closing_percentage'
  ) THEN
    ALTER TABLE leads ADD COLUMN closing_percentage integer DEFAULT 0 CHECK (closing_percentage >= 0 AND closing_percentage <= 100);
  END IF;
END $$;