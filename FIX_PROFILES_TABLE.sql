-- FIX PROFILES TABLE AND REGISTRATION ISSUES
-- This script will fix the profiles table and enable proper user registration

-- Step 1: Drop existing problematic triggers and policies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Temporarily disable RLS to fix existing data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate the profiles table with proper structure
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 4: Create the profiles table with the correct structure
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  name text NULL,
  mobile text NULL,
  role text NULL DEFAULT 'user'::text,
  avatar text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text])))
) TABLESPACE pg_default;

-- Step 5: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies that won't interfere with registration
-- Policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL USING (current_setting('role') = 'service_role');

-- Step 7: Create a function to handle new user registration (optional trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      CASE 
        WHEN NEW.email = 'admin@photography.com' THEN 'admin'
        ELSE 'user'
      END,
      true
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger for automatic profile creation (with error handling)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create updated_at trigger for profiles
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 11: Create admin user profile if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID from auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@photography.com' 
  LIMIT 1;
  
  -- If admin user exists, ensure profile exists
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (admin_user_id, 'admin@photography.com', 'Micheal', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      name = 'Micheal',
      role = 'admin',
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Admin profile created/updated for user ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users table';
  END IF;
END $$;

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 13: Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Verification queries
SELECT 'Profiles table structure:' as info;
\d public.profiles;

SELECT 'Current profiles:' as info;
SELECT id, email, name, role, is_active, created_at FROM public.profiles;

SELECT 'RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

RAISE NOTICE 'Profiles table setup completed successfully!';