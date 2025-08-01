-- Michael Photography Database Migration
-- This migration creates all necessary tables for the photography business application
-- with Row Level Security (RLS) policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE message_status AS ENUM ('unread', 'read', 'replied');

-- =============================================
-- TABLES
-- =============================================

-- 1. User Profiles Table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'user',
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Bookings Table
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status booking_status DEFAULT 'pending',
    gallery_link TEXT,
    mega_link TEXT,
    qr_code TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Media Posts Table (for portfolio/social media)
CREATE TABLE public.media_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    caption TEXT NOT NULL,
    media_type media_type NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Galleries Table
CREATE TABLE public.galleries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    mega_link TEXT NOT NULL,
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Contact Messages Table
CREATE TABLE public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status message_status DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);

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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Bookings RLS Policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete bookings" ON public.bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Media Posts RLS Policies (Public read, admin write)
CREATE POLICY "Anyone can view media posts" ON public.media_posts
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage media posts" ON public.media_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Galleries RLS Policies
CREATE POLICY "Users can view their own galleries" ON public.galleries
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can manage galleries" ON public.galleries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Contact Messages RLS Policies
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view and manage contact messages" ON public.contact_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_bookings
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_media_posts
    BEFORE UPDATE ON public.media_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_galleries
    BEFORE UPDATE ON public.galleries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_contact_messages
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ADMIN USER SETUP
-- =============================================

-- Function to create admin user (run this after admin signs up)
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void AS $$
BEGIN
    -- Update the admin user's profile to have admin role
    UPDATE public.profiles 
    SET role = 'admin'
    WHERE email = 'admin@photography.com';
    
    -- If profile doesn't exist, we'll handle it in the trigger
    IF NOT FOUND THEN
        RAISE NOTICE 'Admin user not found. Please sign up with admin@photography.com first.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modified function to handle admin user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        NEW.email,
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample media posts (these are public)
INSERT INTO public.media_posts (title, caption, media_type, media_url, likes) VALUES
('Magical Wedding Moments', 'Captured the perfect sunset ceremony at Malibu Beach. Every moment was pure magic! ✨', 'image', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800', 127),
('Corporate Excellence', 'Professional headshots that make an impact. Ready to elevate your business presence?', 'image', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800', 89),
('Event Highlights Reel', 'Behind the scenes of our latest corporate event. The energy was incredible!', 'video', 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800', 203),
('Portrait Perfection', 'Natural light portraits that capture authentic emotions. Book your session today!', 'image', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800', 156);

-- =============================================
-- SECURITY NOTES
-- =============================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. RLS Policies ensure users can only access their own data (except admins)
2. Media posts are public for portfolio viewing
3. Galleries can be public or private based on is_public flag
4. Contact messages can be created by anyone but only viewed by admins
5. User profiles are automatically created when users sign up
6. All tables have proper indexes for performance
7. Updated_at timestamps are automatically maintained

NEXT STEPS:
1. Run this migration in your Supabase SQL editor
2. Set up proper authentication in your React app
3. Configure environment variables for Supabase connection
4. Test the RLS policies with different user roles

For additional security:
- Consider adding email verification requirements
- Implement rate limiting for contact form submissions
- Add file upload policies for media storage
- Set up database backups and monitoring
*/