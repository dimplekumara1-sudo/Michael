-- COMPLETE FRESH BACKEND SETUP
-- Run this AFTER running DROP_ALL_BACKEND.sql
-- This creates a clean, working database schema

-- =============================================
-- STEP 1: CREATE CUSTOM TYPES
-- =============================================

-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed', 
    'completed',
    'cancelled'
);

-- Create media type enum
CREATE TYPE public.media_type AS ENUM (
    'image',
    'video'
);

-- =============================================
-- STEP 2: CREATE USER PROFILES VIEW
-- =============================================

-- This view reads from auth.users and provides user profile data
CREATE VIEW public.user_profiles AS
SELECT
    id,
    COALESCE(
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'full_name',
        split_part(email, '@', 1),
        'User'
    ) as name,
    email,
    raw_user_meta_data ->> 'mobile' as mobile,
    CASE
        WHEN email = 'admin@photography.com' THEN 'admin'
        ELSE 'user'
    END as role,
    raw_user_meta_data ->> 'avatar_url' as avatar,
    created_at,
    updated_at
FROM auth.users;

-- =============================================
-- STEP 3: CREATE MAIN TABLES
-- =============================================

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status public.booking_status DEFAULT 'pending',
    gallery_link TEXT,
    mega_link TEXT,
    qr_code TEXT,
    notes TEXT,
    mobile TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media posts table
CREATE TABLE public.media_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    caption TEXT NOT NULL,
    media_type public.media_type NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Galleries table
CREATE TABLE public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Media posts indexes
CREATE INDEX idx_media_posts_media_type ON public.media_posts(media_type);
CREATE INDEX idx_media_posts_created_at ON public.media_posts(created_at);

-- Galleries indexes
CREATE INDEX idx_galleries_booking_id ON public.galleries(booking_id);
CREATE INDEX idx_galleries_is_public ON public.galleries(is_public);

-- Contact messages indexes
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================

-- BOOKINGS POLICIES
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can do everything with bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- MEDIA POSTS POLICIES
-- Anyone can view media posts (public gallery)
CREATE POLICY "Anyone can view media posts" ON public.media_posts
    FOR SELECT USING (true);

-- Only admins can manage media posts
CREATE POLICY "Admins can manage media posts" ON public.media_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- GALLERIES POLICIES
-- Users can view their own galleries
CREATE POLICY "Users can view own galleries" ON public.galleries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = galleries.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Anyone can view public galleries
CREATE POLICY "Anyone can view public galleries" ON public.galleries
    FOR SELECT USING (is_public = true);

-- Admins can manage all galleries
CREATE POLICY "Admins can manage all galleries" ON public.galleries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- CONTACT MESSAGES POLICIES
-- Anyone can create contact messages
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Admins can view contact messages" ON public.contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- Only admins can update contact messages
CREATE POLICY "Admins can update contact messages" ON public.contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- =============================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 8: CREATE TRIGGERS
-- =============================================

-- Trigger for bookings updated_at
CREATE TRIGGER handle_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for media_posts updated_at
CREATE TRIGGER handle_media_posts_updated_at
    BEFORE UPDATE ON public.media_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for galleries updated_at
CREATE TRIGGER handle_galleries_updated_at
    BEFORE UPDATE ON public.galleries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- STEP 9: INSERT SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert some sample media posts for testing
INSERT INTO public.media_posts (title, caption, media_type, media_url, thumbnail) VALUES
('Wedding Photography', 'Beautiful wedding moments captured', 'image', 'https://example.com/wedding1.jpg', 'https://example.com/wedding1_thumb.jpg'),
('Portrait Session', 'Professional portrait photography', 'image', 'https://example.com/portrait1.jpg', 'https://example.com/portrait1_thumb.jpg'),
('Event Highlights', 'Corporate event highlights video', 'video', 'https://example.com/event1.mp4', 'https://example.com/event1_thumb.jpg');

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify the setup
SELECT 
    'Fresh backend setup completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_created,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers_created;