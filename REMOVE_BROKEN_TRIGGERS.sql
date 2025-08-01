-- REMOVE BROKEN TRIGGERS AND FUNCTIONS
-- Run this in Supabase Dashboard > SQL Editor

-- Drop any existing triggers that reference profiles table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_user_update ON auth.users;
DROP TRIGGER IF EXISTS update_user_profile ON auth.users;

-- Drop any functions that reference profiles table
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile() CASCADE;

-- Drop the view since we'll replace it with a table
DROP VIEW IF EXISTS public.user_profiles CASCADE;

SELECT 'Broken triggers and functions removed' as status;