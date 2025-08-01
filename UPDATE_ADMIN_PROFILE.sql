-- UPDATE ADMIN PROFILE NAME
-- Run this in Supabase Dashboard > SQL Editor

-- Update the admin profile to have the correct name
UPDATE public.profiles 
SET 
    name = 'Michael',
    updated_at = NOW()
WHERE email = 'admin@photography.com';

-- If the profile doesn't exist, insert it
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    id,
    email,
    'Michael',
    'admin'
FROM auth.users
WHERE email = 'admin@photography.com'
ON CONFLICT (id) DO UPDATE SET
    name = 'Michael',
    role = 'admin',
    updated_at = NOW();

-- Verify the update
SELECT id, email, name, role, created_at, updated_at
FROM public.profiles 
WHERE email = 'admin@photography.com';