-- MANUAL PROFILE REGISTRATION APPROACH
-- Run this if the trigger approach still doesn't work

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler approach - we'll handle profile creation in the app
-- Just ensure the profiles table has the right permissions

-- Make sure profiles table allows inserts for authenticated users
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable with very permissive policies for testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- Create very simple policies
CREATE POLICY "Allow all for authenticated users" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for service role" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

SELECT 'Manual profile registration setup complete' as status;