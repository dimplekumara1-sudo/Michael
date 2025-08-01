-- =====================================================
-- FIX ADMIN LOGIN ISSUE
-- This script will fix the login issue by ensuring the admin profile exists
-- =====================================================

-- Step 1: Check current state of profiles table
SELECT 'Current profiles in database:' as info;
SELECT id, name, email, role, created_at FROM public.profiles;

-- Step 2: Check if admin user exists in auth.users
SELECT 'Admin user in auth.users:' as info;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@photography.com';

-- Step 3: Get the admin user ID for profile creation
-- Replace this with the actual ID from the query above
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@photography.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Insert or update admin profile
        INSERT INTO public.profiles (id, name, email, role, mobile, created_at, updated_at)
        VALUES (
            admin_user_id,
            'Admin User',
            'admin@photography.com',
            'admin'::user_role,
            NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = 'Admin User',
            role = 'admin'::user_role,
            updated_at = NOW();
            
        RAISE NOTICE 'Admin profile created/updated for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found in auth.users. Please create the user first.';
    END IF;
END $$;

-- Step 4: Verify the admin profile was created
SELECT 'Admin profile verification:' as info;
SELECT p.id, p.name, p.email, p.role, p.created_at,
       au.email as auth_email, au.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'admin@photography.com';

-- Step 5: Check RLS policies are working
SELECT 'RLS status check:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 6: Show all policies on profiles table
SELECT 'Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 7: Create missing RLS policies if needed
DO $$
BEGIN
    -- Policy for users to read their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
        RAISE NOTICE 'Created policy: Users can read own profile';
    END IF;

    -- Policy for users to insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)';
        RAISE NOTICE 'Created policy: Users can insert own profile';
    END IF;

    -- Policy for users to update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
        RAISE NOTICE 'Created policy: Users can update own profile';
    END IF;

    -- Policy for admins to read all profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can read all profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
        RAISE NOTICE 'Created policy: Admins can read all profiles';
    END IF;

    -- Policy for admins to update all profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
        RAISE NOTICE 'Created policy: Admins can update all profiles';
    END IF;
END $$;

-- Step 8: Final verification
SELECT 'Final verification - Admin profile ready:' as status;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: Admin profile exists and is ready for login'
        ELSE 'ERROR: Admin profile still missing'
    END as result
FROM public.profiles 
WHERE email = 'admin@photography.com' AND role = 'admin';

-- Step 9: Show summary
SELECT 'SUMMARY:' as info;
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles,
    COUNT(CASE WHEN email = 'admin@photography.com' THEN 1 END) as admin_email_profiles
FROM public.profiles;