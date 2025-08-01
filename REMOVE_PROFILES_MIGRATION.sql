-- Migration to remove profiles table and use auth.users directly
-- This script removes the profiles table dependency and updates foreign key relationships

-- Step 1: Update bookings table to reference auth.users directly (if not already done)
-- First, let's check if the foreign key constraint exists and update it
DO $$
BEGIN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_user_id_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_user_id_fkey;
    END IF;
    
    -- Add new foreign key constraint to reference auth.users
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Step 2: Update galleries table foreign key if needed
DO $$
BEGIN
    -- Check if galleries table exists and update its foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'galleries') THEN
        -- The galleries table references bookings, so it should still work
        -- No changes needed for galleries table
        NULL;
    END IF;
END $$;

-- Step 3: Drop the profiles table (this will remove all profile data)
-- WARNING: This will permanently delete all profile data!
-- Make sure you have a backup if you need to preserve any profile information

DROP TABLE IF EXISTS profiles CASCADE;

-- Step 4: Create a function to get user display name from auth.users metadata
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    display_name TEXT;
BEGIN
    -- Get user data from auth.users
    SELECT raw_user_meta_data, email INTO user_record
    FROM auth.users 
    WHERE id = user_id;
    
    IF user_record IS NULL THEN
        RETURN 'Unknown User';
    END IF;
    
    -- Try to get name from metadata
    display_name := COALESCE(
        user_record.raw_user_meta_data->>'name',
        user_record.raw_user_meta_data->>'full_name',
        split_part(user_record.email, '@', 1),
        'User'
    );
    
    RETURN display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a view for user information (optional, for easier querying)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1),
        'User'
    ) as name,
    u.email,
    u.raw_user_meta_data->>'mobile' as mobile,
    CASE 
        WHEN u.email = 'admin@photography.com' THEN 'admin'
        ELSE 'user'
    END as role,
    u.raw_user_meta_data->>'avatar_url' as avatar,
    u.created_at,
    u.updated_at
FROM auth.users u;

-- Step 6: Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_display_name(UUID) TO authenticated;

-- Step 7: Create RLS policies for the view if needed
ALTER VIEW user_profiles OWNER TO postgres;

COMMENT ON VIEW user_profiles IS 'Virtual profile view based on auth.users metadata';
COMMENT ON FUNCTION get_user_display_name(UUID) IS 'Helper function to get user display name from auth.users metadata';

-- Migration completed successfully
-- The application should now use auth.users directly instead of the profiles table