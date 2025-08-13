-- COMPREHENSIVE AUTH FIX
-- This script addresses both registration and dashboard access issues
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Ensure profiles table exists with correct schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email character varying(255) NOT NULL,
  name character varying(255) NULL,
  mobile character varying(20) NULL,
  role character varying(20) NOT NULL DEFAULT 'user'::character varying,
  avatar text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles USING btree (mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles USING btree (is_active);

-- Step 3: Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Drop existing auth trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 6: Create robust profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role text := 'user';
BEGIN
    -- Determine user role
    IF NEW.email = 'admin@photography.com' THEN
        user_role := 'admin';
    END IF;
    
    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            name, 
            role, 
            mobile,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'full_name',
                split_part(NEW.email, '@', 1)
            ),
            user_role,
            NEW.raw_user_meta_data->>'mobile',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Profile created successfully for user: %', NEW.email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Profile already exists for user: %', NEW.email;
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create profile for user %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the auth trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Configure RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.profiles;

-- Create comprehensive RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to insert any profile
CREATE POLICY "Admins can insert any profile" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- Step 10: Create admin user if it doesn't exist
DO $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if admin profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE email = 'admin@photography.com'
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE NOTICE 'Admin profile not found. Please create admin user through Supabase Auth UI or registration form.';
    ELSE
        -- Ensure admin has correct role
        UPDATE public.profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE email = 'admin@photography.com' AND role != 'admin';
        
        RAISE NOTICE 'Admin profile verified and updated if necessary.';
    END IF;
END $$;

-- Step 11: Verification queries
SELECT 'Database setup completed successfully!' as status;

-- Verify trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users';

-- Verify function exists
SELECT 
    routine_name, 
    routine_type, 
    security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Show current profiles
SELECT 
    id,
    email,
    name,
    role,
    is_active,
    created_at
FROM public.profiles
ORDER BY created_at DESC;