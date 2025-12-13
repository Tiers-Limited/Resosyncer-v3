-- Create Admin User
-- This migration creates the initial admin user for the system

-- Insert admin user into auth.users using the admin API
-- Note: This requires manual setup through Supabase dashboard or API

-- Create a function to handle admin user creation
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
BEGIN
  -- Insert into profiles table with a known UUID
  -- The admin will need to sign up through the dashboard first
  -- Then we'll update their profile to admin role
  
  -- This is a placeholder function
  -- Actual user creation must be done through Supabase Auth
  RAISE NOTICE 'Admin user must be created through Supabase Auth API or Dashboard';
END;
$$ LANGUAGE plpgsql;
