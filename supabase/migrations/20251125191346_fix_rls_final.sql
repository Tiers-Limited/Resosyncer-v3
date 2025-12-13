-- Fix RLS policies using a function in public schema

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and PMs can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to delete profiles" ON profiles;

-- Create a function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Simpler policies that avoid recursion
-- Anyone authenticated can read any profile
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert during signup (no profile exists yet)
CREATE POLICY "Allow profile creation on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Delete is restricted (profiles are usually not deleted)
CREATE POLICY "Prevent profile deletion"
  ON profiles FOR DELETE
  TO authenticated
  USING (false);
