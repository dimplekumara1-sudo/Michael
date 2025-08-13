-- Slider Management Migration Script
-- This script sets up the media_posts table with the new structure and migrates existing portfolio content

-- First, let's check if the media_posts table exists and update it if needed
DO $$
BEGIN
    -- Check if media_posts table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'media_posts') THEN
        -- Add is_active column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'media_posts' AND column_name = 'is_active') THEN
            ALTER TABLE public.media_posts ADD COLUMN is_active boolean DEFAULT false;
            RAISE NOTICE 'Added is_active column to media_posts table';
        END IF;
        
        -- Update media_type enum to include new values
        -- First check if the enum needs updating
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'slider' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'media_type')) THEN
            ALTER TYPE public.media_type ADD VALUE 'slider';
            RAISE NOTICE 'Added slider to media_type enum';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'homepage' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'media_type')) THEN
            ALTER TYPE public.media_type ADD VALUE 'homepage';
            RAISE NOTICE 'Added homepage to media_type enum';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hero' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'media_type')) THEN
            ALTER TYPE public.media_type ADD VALUE 'hero';
            RAISE NOTICE 'Added hero to media_type enum';
        END IF;
        
        RAISE NOTICE 'Updated existing media_posts table structure';
    ELSE
        -- Create the media_posts table with the complete structure
        CREATE TABLE public.media_posts (
            id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
            title text NOT NULL,
            caption text NOT NULL,
            media_type public.media_type NOT NULL,
            media_url text NOT NULL,
            thumbnail text NULL,
            likes integer NULL DEFAULT 0,
            created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
            updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
            is_active boolean NULL DEFAULT false,
            CONSTRAINT media_posts_pkey PRIMARY KEY (id)
        ) TABLESPACE pg_default;
        
        RAISE NOTICE 'Created new media_posts table';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_media_posts_media_type ON public.media_posts USING btree (media_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_media_posts_created_at ON public.media_posts USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_media_posts_type_active ON public.media_posts USING btree (media_type, is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_media_posts_hero_active ON public.media_posts USING btree (is_active) TABLESPACE pg_default
WHERE (media_type = 'hero'::media_type);

-- Create or replace the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_media_posts ON media_posts;
CREATE TRIGGER handle_updated_at_media_posts 
    BEFORE UPDATE ON media_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_updated_at();

-- Create or replace the ensure_single_active_hero function
CREATE OR REPLACE FUNCTION ensure_single_active_hero()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a hero media being set to active
    IF NEW.media_type = 'hero' AND NEW.is_active = true THEN
        -- Deactivate all other hero media
        UPDATE public.media_posts 
        SET is_active = false 
        WHERE media_type = 'hero' AND id != NEW.id AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the ensure_single_active_hero trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_active_hero ON media_posts;
CREATE TRIGGER trigger_ensure_single_active_hero 
    BEFORE INSERT OR UPDATE ON media_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION ensure_single_active_hero();

-- Insert default portfolio slider items if they don't exist
INSERT INTO public.media_posts (title, caption, media_type, media_url, thumbnail, is_active)
SELECT * FROM (VALUES
    ('Wedding', 'THE BIG DAY - Capturing your special day with artistic flair and attention to every precious detail', 'slider'::media_type, 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Films', 'CREATIVITY SHOW - Professional film production and creative storytelling', 'slider'::media_type, 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Outdoors', 'BEGINNING OF A JOURNEY - Nature and outdoor photography adventures', 'slider'::media_type, 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Corporate', 'PROFESSIONAL EXCELLENCE - Corporate events and professional photography', 'slider'::media_type, 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Portrait', 'PERSONAL STORIES - Individual and family portrait sessions', 'slider'::media_type, 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Events', 'MEMORABLE MOMENTS - Special events and celebration photography', 'slider'::media_type, 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=400', true)
) AS v(title, caption, media_type, media_url, thumbnail, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM public.media_posts WHERE media_type = 'slider'::media_type
);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.media_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media_posts
-- Allow public read access to active media
DROP POLICY IF EXISTS "Allow public read access to active media" ON public.media_posts;
CREATE POLICY "Allow public read access to active media" ON public.media_posts
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all media
DROP POLICY IF EXISTS "Allow authenticated users to read all media" ON public.media_posts;
CREATE POLICY "Allow authenticated users to read all media" ON public.media_posts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users full access
DROP POLICY IF EXISTS "Allow admin users full access to media" ON public.media_posts;
CREATE POLICY "Allow admin users full access to media" ON public.media_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.media_posts TO anon;
GRANT ALL ON public.media_posts TO authenticated;
GRANT ALL ON public.media_posts TO service_role;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Slider Management Migration completed successfully!';
    RAISE NOTICE '📊 Portfolio slider items have been migrated to the database';
    RAISE NOTICE '🎛️ Admin dashboard now includes slider management under "Homepage & Slider Management"';
    RAISE NOTICE '🔄 PortfolioCarousel component now uses database content';
END $$;