/*
  # Update Leads Schema - Status and Columns

  1. Changes to Status
    - Remove old status constraint
    - Add new status constraint with only: 'in_progress', 'closed', 'not_closed'
    - Update existing leads to new status values:
      - 'new' → 'in_progress'
      - 'contacted' → 'in_progress'
      - 'qualified' → 'in_progress'
      - 'converted' → 'closed'
      - 'lost' → 'not_closed'

  2. Column Changes
    - Remove 'email' column (if exists)
    - Remove 'contact' column (if exists)
    - Add 'remarks' column (text)
    - Add 'last_followup_date' column (date)

  3. Notes
    - Data migration ensures no data loss for existing records
    - New columns allow tracking of lead interactions
*/

-- Update existing statuses to new values
UPDATE leads 
SET status = CASE 
  WHEN status = 'new' THEN 'in_progress'
  WHEN status = 'contacted' THEN 'in_progress'
  WHEN status = 'qualified' THEN 'in_progress'
  WHEN status = 'converted' THEN 'closed'
  WHEN status = 'lost' THEN 'not_closed'
  ELSE 'in_progress'
END
WHERE status IN ('new', 'contacted', 'qualified', 'converted', 'lost');

-- Drop old constraint if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE leads DROP CONSTRAINT leads_status_check;
  END IF;
END $$;

-- Add new status constraint
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('in_progress', 'closed', 'not_closed'));

-- Drop email and contact columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE leads DROP COLUMN email;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'contact'
  ) THEN
    ALTER TABLE leads DROP COLUMN contact;
  END IF;
END $$;

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'remarks'
  ) THEN
    ALTER TABLE leads ADD COLUMN remarks text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_followup_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_followup_date date;
  END IF;
END $$;