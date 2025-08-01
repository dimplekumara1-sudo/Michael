-- TEST REGISTRATION SETUP
-- Run this in Supabase Dashboard > SQL Editor to verify everything is working

-- Check if profiles table exists and has correct structure
SELECT 'Checking profiles table structure...' as status;
\d public.profiles;

-- Check RLS status
SELECT 'Checking RLS status...' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check current policies
SELECT 'Current RLS policies:' as status;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if trigger exists
SELECT 'Checking trigger status...' as status;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 'Checking function status...' as status;
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test basic permissions
SELECT 'Testing basic table access...' as status;
SELECT COUNT(*) as profile_count FROM public.profiles;

SELECT 'Database setup verification complete!' as status;