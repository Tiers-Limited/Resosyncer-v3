/*
  # Add File Columns to Documents Table

  1. Changes
    - Add file_url column to store the storage path
    - Add file_size column to store file size in bytes
    - Both columns are nullable (folders won't have these values)

  2. Notes
    - file_url stores the path in storage bucket
    - file_size is stored in bytes
    - These columns only apply to file type documents
*/

-- Add file_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_url text;
  END IF;
END $$;

-- Add file_size column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_size bigint;
  END IF;
END $$;
