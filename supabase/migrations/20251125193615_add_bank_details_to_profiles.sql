/*
  # Add Bank Account Details to Profiles

  1. Changes
    - Add `bank_account_name` column to store account holder name
    - Add `bank_account_number` column to store account number
    - Add `bank_name` column to store bank name

  2. Notes
    - All fields are optional
    - Bank name will be stored as text to accommodate both dropdown selections and custom entries
*/

-- Add bank account details columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bank_account_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bank_account_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bank_account_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bank_name text;
  END IF;
END $$;
