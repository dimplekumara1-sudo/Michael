-- COMPLETE BACKEND RESET
-- Run this in Supabase Dashboard > SQL Editor
-- This will drop all existing tables, views, policies, and start fresh

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view media posts" ON public.media_posts;
DROP POLICY IF EXISTS "Admins can manage media posts" ON public.media_posts;
DROP POLICY IF EXISTS "Users can view their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Anyone can view public galleries" ON public.galleries;
DROP POLICY IF EXISTS "Admins can manage all galleries" ON public.galleries;
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;

-- Drop all triggers
DROP TRIGGER IF EXISTS handle_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS handle_media_posts_updated_at ON public.media_posts;
DROP TRIGGER IF EXISTS handle_galleries_updated_at ON public.galleries;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop all tables
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.galleries CASCADE;
DROP TABLE IF EXISTS public.media_posts CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all views
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.media_type CASCADE;

-- Clean up any remaining indexes (they should be dropped with tables, but just in case)
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_event_date;
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_media_posts_media_type;
DROP INDEX IF EXISTS idx_media_posts_created_at;

-- Note: We cannot drop auth.users table as it's managed by Supabase
-- But we can clean up any custom users if needed

SELECT 'Backend completely reset. Ready for fresh setup.' as status;