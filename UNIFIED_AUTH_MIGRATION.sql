-- =====================================================
-- UNIFIED AUTH & PROFILES TABLE MIGRATION
-- This script ensures auth.users and profiles tables stay in sync
-- =====================================================

-- First, ensure the profiles table has the mobile column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile text NULL;

-- Create index for mobile column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_mobile 
ON public.profiles USING btree (mobile) TABLESPACE pg_default;

-- Create index for email column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles USING btree (email) TABLESPACE pg_default;

-- Create index for role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles USING btree (role) TABLESPACE pg_default;

-- =====================================================
-- FUNCTION: Create or update profile from auth user
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_name text;
    user_role user_role;
BEGIN
    -- Determine name from email or raw_user_meta_data
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Special handling for admin user
    IF NEW.email = 'admin@photography.com' THEN
        user_name := 'Admin User';
        user_role := 'admin'::user_role;
    ELSE
        user_role := 'user'::user_role;
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (
        id,
        name,
        email,
        mobile,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        NEW.email,
        NEW.raw_user_meta_data->>'mobile',
        user_role,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
        role = CASE 
            WHEN EXCLUDED.email = 'admin@photography.com' THEN 'admin'::user_role
            ELSE profiles.role
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Handle user updates
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
DECLARE
    user_name text;
    user_role user_role;
BEGIN
    -- Only proceed if email or metadata changed
    IF OLD.email IS DISTINCT FROM NEW.email OR 
       OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
        
        -- Determine name from email or raw_user_meta_data
        user_name := COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1),
            'User'
        );
        
        -- Special handling for admin user
        IF NEW.email = 'admin@photography.com' THEN
            user_name := 'Admin User';
            user_role := 'admin'::user_role;
        ELSE
            -- Keep existing role for non-admin users
            SELECT role INTO user_role FROM public.profiles WHERE id = NEW.id;
            user_role := COALESCE(user_role, 'user'::user_role);
        END IF;

        -- Update profile
        UPDATE public.profiles SET
            name = user_name,
            email = NEW.email,
            mobile = COALESCE(NEW.raw_user_meta_data->>'mobile', mobile),
            role = user_role,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Handle user deletion
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
    -- Delete associated profile
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Create new triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- =====================================================
-- SYNC EXISTING DATA
-- =====================================================

-- Insert profiles for auth users that don't have profiles
INSERT INTO public.profiles (id, name, email, mobile, role, created_at, updated_at)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'admin@photography.com' THEN 'Admin User'
        ELSE COALESCE(
            au.raw_user_meta_data->>'name',
            au.raw_user_meta_data->>'full_name',
            split_part(au.email, '@', 1),
            'User'
        )
    END as name,
    au.email,
    au.raw_user_meta_data->>'mobile' as mobile,
    CASE 
        WHEN au.email = 'admin@photography.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email IS NOT NULL;

-- Update existing profiles to match auth users
UPDATE public.profiles 
SET 
    name = CASE 
        WHEN au.email = 'admin@photography.com' THEN 'Admin User'
        ELSE COALESCE(
            au.raw_user_meta_data->>'name',
            au.raw_user_meta_data->>'full_name',
            profiles.name
        )
    END,
    email = au.email,
    mobile = COALESCE(au.raw_user_meta_data->>'mobile', profiles.mobile),
    role = CASE 
        WHEN au.email = 'admin@photography.com' THEN 'admin'::user_role
        ELSE profiles.role
    END,
    updated_at = NOW()
FROM auth.users au
WHERE profiles.id = au.id
AND (
    profiles.email != au.email OR 
    (au.email = 'admin@photography.com' AND profiles.name != 'Admin User') OR
    (au.email = 'admin@photography.com' AND profiles.role != 'admin'::user_role)
);

-- Remove orphaned profiles (profiles without corresponding auth users)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to manually sync a specific user
CREATE OR REPLACE FUNCTION public.sync_user_profile(user_id uuid)
RETURNS void AS $$
DECLARE
    auth_user auth.users%ROWTYPE;
BEGIN
    -- Get auth user
    SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found in auth.users: %', user_id;
    END IF;
    
    -- Trigger the sync
    PERFORM public.handle_new_user() FROM (SELECT auth_user.*) AS NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check sync status
CREATE OR REPLACE FUNCTION public.check_auth_profile_sync()
RETURNS TABLE(
    status text,
    auth_users_count bigint,
    profiles_count bigint,
    missing_profiles bigint,
    orphaned_profiles bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Sync Status'::text as status,
        (SELECT COUNT(*) FROM auth.users WHERE email IS NOT NULL) as auth_users_count,
        (SELECT COUNT(*) FROM public.profiles) as profiles_count,
        (SELECT COUNT(*) FROM auth.users au 
         LEFT JOIN public.profiles p ON au.id = p.id 
         WHERE p.id IS NULL AND au.email IS NOT NULL) as missing_profiles,
        (SELECT COUNT(*) FROM public.profiles p 
         LEFT JOIN auth.users au ON p.id = au.id 
         WHERE au.id IS NULL) as orphaned_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: System can insert profiles (for triggers)
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the sync status
SELECT * FROM public.check_auth_profile_sync();

-- Verify admin user
SELECT 
    'Admin User Verification' as check_type,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created,
    p.id as profile_id,
    p.name as profile_name,
    p.email as profile_email,
    p.role as profile_role,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'admin@photography.com';