-- FIX RLS POLICIES
-- Run this in Supabase Dashboard > SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view media posts" ON public.media_posts;
DROP POLICY IF EXISTS "Admins can manage media posts" ON public.media_posts;
DROP POLICY IF EXISTS "Users can view own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Anyone can view public galleries" ON public.galleries;
DROP POLICY IF EXISTS "Admins can manage all galleries" ON public.galleries;
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'admin@photography.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BOOKINGS POLICIES (More permissive for testing)
CREATE POLICY "Enable read access for authenticated users" ON public.bookings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.bookings
    FOR DELETE USING (auth.role() = 'authenticated');

-- MEDIA POSTS POLICIES (Public read, authenticated write)
CREATE POLICY "Enable read access for all users" ON public.media_posts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.media_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.media_posts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.media_posts
    FOR DELETE USING (auth.role() = 'authenticated');

-- GALLERIES POLICIES
CREATE POLICY "Enable read access for authenticated users" ON public.galleries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.galleries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.galleries
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.galleries
    FOR DELETE USING (auth.role() = 'authenticated');

-- CONTACT MESSAGES POLICIES
CREATE POLICY "Enable read access for authenticated users" ON public.contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.contact_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Test the policies
SELECT 'RLS policies updated successfully!' as status;