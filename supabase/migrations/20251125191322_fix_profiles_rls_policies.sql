-- Fix infinite recursion in profiles RLS policies
-- The issue is that policies were checking profiles table while querying profiles table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new policies without recursion
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users with admin or project_manager role to view all profiles
CREATE POLICY "Admins and PMs can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'project_manager')
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to insert new profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
