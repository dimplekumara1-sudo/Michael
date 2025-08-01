-- DIAGNOSE REGISTRATION ISSUE
-- Run this in Supabase Dashboard > SQL Editor to identify the problem

-- Check 1: Verify profiles table structure
SELECT 'Checking profiles table structure...' as check_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Verify RLS is enabled
SELECT 'Checking RLS status...' as check_name;
SELECT schemaname, tablename, rowsecurity, hasrls
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check 3: List all policies
SELECT 'Current RLS policies...' as check_name;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check 4: Verify trigger exists and is active
SELECT 'Checking trigger status...' as check_name;
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check 5: Verify function exists
SELECT 'Checking function status...' as check_name;
SELECT 
    routine_name, 
    routine_type, 
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check 6: Test basic table access
SELECT 'Testing table access...' as check_name;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check 7: Check for any existing test users
SELECT 'Existing profiles...' as check_name;
SELECT id, email, name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check 8: Verify auth.users table access
SELECT 'Checking auth.users access...' as check_name;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Check 9: Test if we can manually insert a profile (this will help identify permission issues)
SELECT 'Testing manual profile insertion...' as check_name;

-- Create a test profile to see if INSERT works
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    -- Try to insert a test profile
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (test_id, 'test@example.com', 'Test User', 'user', NOW(), NOW());
    
    RAISE NOTICE 'Test profile inserted successfully with ID: %', test_id;
    
    -- Clean up the test profile
    DELETE FROM public.profiles WHERE id = test_id;
    RAISE NOTICE 'Test profile cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to insert test profile: %', SQLERRM;
END $$;

SELECT 'Diagnostic complete!' as status;