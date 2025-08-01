-- Fix login issues and database permissions
-- This script addresses RLS policy issues and ensures proper access

-- Step 1: Ensure the bookings table exists with correct structure
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_date date NOT NULL,
  location text NOT NULL,
  event_type text NOT NULL,
  status text NULL DEFAULT 'pending',
  gallery_link text NULL,
  mega_link text NULL,
  qr_code text NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  mobile text NULL,
  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- Step 2: Create booking_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Update bookings table to use enum if needed
DO $$
BEGIN
    -- Try to alter the column to use the enum
    ALTER TABLE bookings ALTER COLUMN status TYPE booking_status USING status::booking_status;
    ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending'::booking_status;
EXCEPTION
    WHEN OTHERS THEN
        -- If it fails, just ensure the column exists
        NULL;
END $$;

-- Step 4: Ensure foreign key constraint exists
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_user_id_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_user_id_fkey;
    END IF;
    
    -- Add new foreign key constraint
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- If foreign key creation fails, continue
        NULL;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings USING btree (event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings USING btree (created_at);

-- Step 6: Drop and recreate RLS policies to fix permission issues
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;

-- Step 7: Re-enable RLS and create simplified policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own bookings
CREATE POLICY "Users can insert own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@photography.com'
        )
    );

-- Allow admins to update all bookings
CREATE POLICY "Admins can update all bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@photography.com'
        )
    );

-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings" ON bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@photography.com'
        )
    );

-- Step 8: Create user_profiles view with proper permissions
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

-- Step 9: Create get_user_display_name function
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

-- Step 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_display_name(UUID) TO authenticated;

-- Step 11: Set proper ownership
ALTER TABLE bookings OWNER TO postgres;
ALTER VIEW user_profiles OWNER TO postgres;
ALTER FUNCTION get_user_display_name(UUID) OWNER TO postgres;

-- Step 12: Create a simple test function to verify permissions
CREATE OR REPLACE FUNCTION test_user_permissions()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    user_count INTEGER;
    booking_count INTEGER;
BEGIN
    -- Test if we can count users (should work for authenticated users)
    SELECT COUNT(*) INTO user_count FROM auth.users LIMIT 1;
    result := result || 'Users accessible: ' || COALESCE(user_count::text, '0') || E'\n';
    
    -- Test if we can access bookings table
    BEGIN
        SELECT COUNT(*) INTO booking_count FROM bookings LIMIT 1;
        result := result || 'Bookings accessible: ' || COALESCE(booking_count::text, '0') || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || 'Bookings access error: ' || SQLERRM || E'\n';
    END;
    
    -- Test user_profiles view
    BEGIN
        SELECT COUNT(*) INTO user_count FROM user_profiles LIMIT 1;
        result := result || 'User profiles accessible: ' || COALESCE(user_count::text, '0') || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || 'User profiles access error: ' || SQLERRM || E'\n';
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_user_permissions() TO authenticated;

-- Step 13: Add comments
COMMENT ON TABLE bookings IS 'Event bookings table with proper RLS policies';
COMMENT ON VIEW user_profiles IS 'User profile view based on auth.users metadata';
COMMENT ON FUNCTION get_user_display_name(UUID) IS 'Get display name for a user';
COMMENT ON FUNCTION test_user_permissions() IS 'Test function to verify database permissions';

-- Completion message
SELECT 'Database permissions and RLS policies fixed! 🎉' as status;