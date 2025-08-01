-- CORRECTED DIAGNOSE REGISTRATION ISSUE
-- Run this in Supabase Dashboard > SQL Editor

-- Check 1: Verify profiles table structure
SELECT 'Checking profiles table structure...' as check_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Verify RLS is enabled (corrected query)
SELECT 'Checking RLS status...' as check_name;
SELECT schemaname, tablename, rowsecurity
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

-- Check 5: Test basic table access
SELECT 'Testing table access...' as check_name;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check 6: Check for any existing profiles
SELECT 'Existing profiles...' as check_name;
SELECT id, email, name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check 7: Test manual profile insertion with a real user scenario
SELECT 'Testing manual profile insertion...' as check_name;

-- Simulate what the trigger should do
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'test_' || extract(epoch from now()) || '@example.com';
BEGIN
    -- Try to insert a test profile exactly like the trigger would
    INSERT INTO public.profiles (id, email, name, role, mobile, created_at, updated_at)
    VALUES (
        test_id, 
        test_email, 
        'Test User', 
        'user', 
        NULL,
        NOW(), 
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS: Test profile inserted with ID: %', test_id;
    
    -- Verify we can read it back
    PERFORM * FROM public.profiles WHERE id = test_id;
    RAISE NOTICE 'SUCCESS: Test profile can be read back';
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_id;
    RAISE NOTICE 'SUCCESS: Test profile cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAILED: Manual profile insertion failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Check 8: Test if the trigger function can be called directly
SELECT 'Testing trigger function directly...' as check_name;

-- Check 9: Look for any constraints that might be failing
SELECT 'Checking table constraints...' as check_name;
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles' AND tc.table_schema = 'public';

-- Check 10: Verify auth schema access
SELECT 'Testing auth schema access...' as check_name;
SELECT COUNT(*) as auth_users_count FROM auth.users;

SELECT 'Corrected diagnostic complete!' as status;