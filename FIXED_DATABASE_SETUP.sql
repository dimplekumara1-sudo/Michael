-- FIXED DATABASE SETUP FOR SUPABASE
-- Run this in Supabase Dashboard > SQL Editor

-- First, create the booking_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create media_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.media_type AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the user_profiles view (this reads from auth.users)
CREATE OR REPLACE VIEW public.user_profiles AS
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

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status public.booking_status DEFAULT 'pending',
  gallery_link TEXT,
  mega_link TEXT,
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  mobile TEXT NOT NULL,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings (event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings (created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- Create media_posts table
CREATE TABLE IF NOT EXISTS public.media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  media_type public.media_type NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT media_posts_pkey PRIMARY KEY (id)
);

-- Create indexes for media_posts
CREATE INDEX IF NOT EXISTS idx_media_posts_media_type ON public.media_posts (media_type);
CREATE INDEX IF NOT EXISTS idx_media_posts_created_at ON public.media_posts (created_at);

-- Create galleries table
CREATE TABLE IF NOT EXISTS public.galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT galleries_pkey PRIMARY KEY (id),
  CONSTRAINT galleries_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings (id) ON DELETE CASCADE
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@photography.com'
    )
  );

-- RLS Policies for media_posts (public read, admin write)
CREATE POLICY "Anyone can view media posts" ON public.media_posts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage media posts" ON public.media_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@photography.com'
    )
  );

-- RLS Policies for galleries
CREATE POLICY "Users can view their own galleries" ON public.galleries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = galleries.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view public galleries" ON public.galleries
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all galleries" ON public.galleries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@photography.com'
    )
  );

-- RLS Policies for contact_messages
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@photography.com'
    )
  );

CREATE POLICY "Admins can update contact messages" ON public.contact_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@photography.com'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_media_posts_updated_at
  BEFORE UPDATE ON public.media_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_galleries_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();