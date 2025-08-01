-- TEMPORARILY DISABLE RLS FOR TESTING
-- Run this in Supabase Dashboard > SQL Editor
-- This will help us test if the issue is with RLS policies

-- Disable RLS on all tables temporarily
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for testing' as status;