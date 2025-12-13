-- Fix documents RLS policies to allow proper access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON documents;

-- Allow all authenticated users to view documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to create documents/folders
CREATE POLICY "Authenticated users can create documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Allow users to update their own documents or admins can update any
CREATE POLICY "Users can update own documents or admins can update any"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    uploaded_by = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow users to delete their own documents or admins can delete any
CREATE POLICY "Users can delete own documents or admins can delete any"
  ON documents FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
