-- FIX ADMIN USER METADATA
-- Run this in Supabase Dashboard > SQL Editor

-- Update the admin user's metadata to include name and full_name
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'name', 'Micheal',
    'full_name', 'Micheal',
    'email_verified', true
)
WHERE email = 'admin@photography.com';

-- Verify the update
SELECT 
    email,
    raw_user_meta_data,
    raw_user_meta_data ->> 'name' as name,
    raw_user_meta_data ->> 'full_name' as full_name
FROM auth.users 
WHERE email = 'admin@photography.com';