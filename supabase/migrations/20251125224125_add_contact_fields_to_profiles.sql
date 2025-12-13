/*
  # Add Contact Fields to Profiles

  1. Changes
    - Add `phone` column to `profiles` table for contact numbers
    - Add `address` column to `profiles` table for home addresses
    - Add `cnic` column to `profiles` table for national ID numbers

  2. Notes
    - Used in letter generation and employee management
    - All fields are optional (can be null)
*/

-- Add contact fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cnic'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cnic text;
  END IF;
END $$;
