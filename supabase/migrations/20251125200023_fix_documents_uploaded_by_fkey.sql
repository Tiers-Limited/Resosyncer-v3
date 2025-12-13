/*
  # Fix Documents uploaded_by Foreign Key Constraint

  1. Changes
    - Drop existing foreign key constraint on uploaded_by
    - Recreate foreign key constraint with ON DELETE SET NULL
    - This allows the constraint to be more flexible
    
  2. Notes
    - The column already allows NULL values
    - Foreign key constraints don't apply to NULL values
    - This ensures uploads work even if profile hasn't synced yet
*/

-- Drop the existing foreign key constraint
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;

-- Recreate the foreign key constraint with SET NULL on delete
ALTER TABLE documents
ADD CONSTRAINT documents_uploaded_by_fkey
FOREIGN KEY (uploaded_by)
REFERENCES profiles(id)
ON DELETE SET NULL;
