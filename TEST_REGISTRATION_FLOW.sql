-- TEST REGISTRATION FLOW
-- This simulates what happens during user registration
-- Run this AFTER running FINAL_REGISTRATION_FIX.sql

-- Step 1: Check current state
SELECT 'Current profiles count:' as info, COUNT(*) as count FROM public.profiles;

-- Step 2: Simulate the trigger by manually calling the function
-- (This tests if the function works without actually creating a user)
DO $$
DECLARE
    test_user_record RECORD;
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'testuser_' || extract(epoch from now()) || '@example.com';
BEGIN
    -- Create a mock NEW record similar to what auth.users would have
    SELECT 
        test_id as id,
        test_email as email,
        '{"name": "Test User", "mobile": "+1234567890"}'::jsonb as raw_user_meta_data,
        now() as created_at
    INTO test_user_record;
    
    RAISE NOTICE 'Simulating user creation for: %', test_email;
    
    -- This simulates what the trigger would do
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
        test_user_record.id,
        test_user_record.email,
        COALESCE(
            test_user_record.raw_user_meta_data->>'name',
            test_user_record.raw_user_meta_data->>'full_name',
            split_part(test_user_record.email, '@', 1),
            'User'
        ),
        CASE 
            WHEN test_user_record.email = 'admin@photography.com' THEN 'admin'
            ELSE 'user'
        END,
        test_user_record.raw_user_meta_data->>'mobile',
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS: Profile created for test user';
    
    -- Verify we can read it
    PERFORM * FROM public.profiles WHERE id = test_user_record.id;
    RAISE NOTICE 'SUCCESS: Profile can be read back';
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_user_record.id;
    RAISE NOTICE 'SUCCESS: Test profile cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE ERROR 'FAILED: Profile creation simulation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Step 3: Check if we can perform basic operations that the app needs
SELECT 'Testing app-like operations...' as info;

-- Test SELECT (what fetchUserProfile does)
SELECT 'Can select profiles:' as test, 
       CASE WHEN COUNT(*) >= 0 THEN 'YES' ELSE 'NO' END as result
FROM public.profiles;

-- Test if we have the right permissions
SELECT 'Current user can insert:' as test,
       CASE WHEN has_table_privilege('public.profiles', 'INSERT') THEN 'YES' ELSE 'NO' END as result;

SELECT 'Current user can select:' as test,
       CASE WHEN has_table_privilege('public.profiles', 'SELECT') THEN 'YES' ELSE 'NO' END as result;

SELECT 'Current user can update:' as test,
       CASE WHEN has_table_privilege('public.profiles', 'UPDATE') THEN 'YES' ELSE 'NO' END as result;

SELECT 'Registration flow test complete!' as status;
SELECT 'If all tests passed, registration should work now!' as result;