-- =====================================================
-- QUICK FIX FOR DATABASE ISSUES
-- Run this in your Supabase SQL Editor to fix the login error
-- =====================================================

-- Step 1: Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    mobile text,
    role user_role DEFAULT 'user'::user_role,
    avatar text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);

-- Step 4: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Step 6: Create RLS policies
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 7: Insert admin profile if it doesn't exist
-- Replace 'f9bd45af-0ab3-4f35-b096-bdff6f69bd66' with your actual admin user ID
INSERT INTO public.profiles (id, name, email, mobile, role, created_at, updated_at)
SELECT
    'f9bd45af-0ab3-4f35-b096-bdff6f69bd66'::uuid,
    'Admin User',
    'admin@photography.com',
    NULL,
    'admin'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = 'f9bd45af-0ab3-4f35-b096-bdff6f69bd66'::uuid
);

-- Step 8: Update existing admin profile to ensure correct name and role
UPDATE public.profiles 
SET 
    name = 'Admin User',
    role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'admin@photography.com';

-- Step 9: Verify the setup
SELECT 
    'Setup Verification' as check_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles,
    COUNT(CASE WHEN email = 'admin@photography.com' THEN 1 END) as admin_email_profiles
FROM public.profiles;

-- Step 10: Show admin profile details
SELECT 
    'Admin Profile Details' as info,
    id,
    name,
    email,
    role,
    created_at
FROM public.profiles 
WHERE email = 'admin@photography.com';

-- Step 11: Check if auth user exists for admin
SELECT 
    'Auth User Check' as info,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created,
    p.id as profile_id,
    p.name as profile_name,
    p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'admin@photography.com';

-- Success message
SELECT 'Database setup completed! You should now be able to login without the "Database error granting user" error.' as status;