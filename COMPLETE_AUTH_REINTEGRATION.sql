-- =====================================================
-- COMPLETE AUTH REINTEGRATION SCRIPT
-- This script will drop and recreate the profiles table with proper triggers
-- and create the admin user with name "Michael"
-- =====================================================

-- Step 1: Drop existing profiles table and related objects
DROP VIEW IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_delete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_auth_profile_sync() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;

-- Step 2: Create user_role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Step 3: Create profiles table with proper structure
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role user_role DEFAULT 'user'::user_role,
    avatar text,
    mobile text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz DEFAULT timezone('utc'::text, now()),
    
    -- Constraints
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_mobile ON public.profiles USING btree (mobile);

-- Step 5: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create helper function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    -- Use SECURITY DEFINER to bypass RLS and get the role directly
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = user_id;
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6.1: Create function to get current user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    role user_role,
    avatar text,
    mobile text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.email,
        p.role,
        p.avatar,
        p.mobile,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create RLS policies
CREATE POLICY "Enable read access for users" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        public.is_admin(auth.uid())
    );

CREATE POLICY "Enable insert for users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        public.is_admin(auth.uid())
    );

CREATE POLICY "Enable delete for admins" ON public.profiles
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Step 7.1: Create a view for easier profile access (optional, for debugging)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.avatar,
    p.mobile,
    p.created_at,
    p.updated_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Step 8: Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'Michael'
            ELSE COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
        END,
        NEW.email,
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END,
        NEW.created_at,
        NEW.updated_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
    UPDATE public.profiles
    SET 
        email = NEW.email,
        updated_at = NEW.updated_at,
        -- Only update name if it's not the admin user (preserve "Michael")
        name = CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'Michael'
            WHEN OLD.email != NEW.email THEN COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
            ELSE name
        END
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Drop existing triggers if they exist and create new ones
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Step 12: Create updated_at trigger for profiles table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 13: Create utility functions for manual sync
CREATE OR REPLACE FUNCTION public.sync_user_profile(user_id uuid)
RETURNS void AS $$
DECLARE
    user_record auth.users%ROWTYPE;
BEGIN
    -- Get user from auth.users
    SELECT * INTO user_record FROM auth.users WHERE id = user_id;
    
    IF user_record.id IS NOT NULL THEN
        -- Insert or update profile
        INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
        VALUES (
            user_record.id,
            CASE 
                WHEN user_record.email = 'admin@photography.com' THEN 'Michael'
                ELSE COALESCE(user_record.raw_user_meta_data->>'name', user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1))
            END,
            user_record.email,
            CASE 
                WHEN user_record.email = 'admin@photography.com' THEN 'admin'::user_role
                ELSE 'user'::user_role
            END,
            user_record.created_at,
            user_record.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            name = CASE 
                WHEN user_record.email = 'admin@photography.com' THEN 'Michael'
                ELSE EXCLUDED.name
            END,
            email = EXCLUDED.email,
            role = CASE 
                WHEN user_record.email = 'admin@photography.com' THEN 'admin'::user_role
                ELSE EXCLUDED.role
            END,
            updated_at = EXCLUDED.updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Create function to check sync status
CREATE OR REPLACE FUNCTION public.check_auth_profile_sync()
RETURNS TABLE (
    auth_users_count bigint,
    profiles_count bigint,
    missing_profiles bigint,
    orphaned_profiles bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as auth_users_count,
        (SELECT COUNT(*) FROM public.profiles) as profiles_count,
        (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL) as missing_profiles,
        (SELECT COUNT(*) FROM public.profiles p LEFT JOIN auth.users au ON p.id = au.id WHERE au.id IS NULL) as orphaned_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 15: Sync all existing auth users to profiles
INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'admin@photography.com' THEN 'Michael'
        ELSE COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
    END as name,
    au.email,
    CASE 
        WHEN au.email = 'admin@photography.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role,
    au.created_at,
    au.updated_at
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
    name = CASE 
        WHEN EXCLUDED.email = 'admin@photography.com' THEN 'Michael'
        ELSE EXCLUDED.name
    END,
    email = EXCLUDED.email,
    role = CASE 
        WHEN EXCLUDED.email = 'admin@photography.com' THEN 'admin'::user_role
        ELSE EXCLUDED.role
    END,
    updated_at = EXCLUDED.updated_at;

-- Step 16: Verification queries
SELECT 'Auth-Profile Sync Status:' as info;
SELECT * FROM public.check_auth_profile_sync();

SELECT 'Admin Profile Status:' as info;
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    au.email_confirmed_at,
    p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'admin@photography.com';

SELECT 'All Profiles:' as info;
SELECT id, name, email, role, created_at FROM public.profiles ORDER BY created_at;

-- Success message
SELECT 'SUCCESS: Auth reintegration completed! Profiles table recreated with automatic sync triggers.' as status;
SELECT 'Admin user "Michael" will be created automatically when they first login or register.' as note;