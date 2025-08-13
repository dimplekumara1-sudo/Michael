-- Hero Media Management Migration
-- This script adds support for hero media management in the admin dashboard

-- 1. Add 'hero' to the media_type enum
DO $$ 
BEGIN
    -- Check if 'hero' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'hero' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'media_type'
        )
    ) THEN
        -- Add 'hero' to the media_type enum
        ALTER TYPE public.media_type ADD VALUE 'hero';
    END IF;
END $$;

-- 2. Add is_active column to media_posts table
DO $$
BEGIN
    -- Check if is_active column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'media_posts' 
        AND column_name = 'is_active'
    ) THEN
        -- Add is_active column
        ALTER TABLE public.media_posts 
        ADD COLUMN is_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create index on media_type and is_active for better query performance
CREATE INDEX IF NOT EXISTS idx_media_posts_type_active 
ON public.media_posts (media_type, is_active);

-- 4. Create index on is_active for hero media queries
CREATE INDEX IF NOT EXISTS idx_media_posts_hero_active 
ON public.media_posts (is_active) 
WHERE media_type = 'hero';

-- 5. Add RLS policies for hero media (if RLS is enabled)
DO $$
BEGIN
    -- Check if RLS is enabled on media_posts table
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'media_posts' 
        AND relrowsecurity = true
    ) THEN
        -- Create policy for hero media access (public read access)
        DROP POLICY IF EXISTS "Hero media is publicly readable" ON public.media_posts;
        CREATE POLICY "Hero media is publicly readable" 
        ON public.media_posts FOR SELECT 
        USING (media_type = 'hero' AND is_active = true);
        
        -- Create policy for admin management of hero media
        DROP POLICY IF EXISTS "Admins can manage hero media" ON public.media_posts;
        CREATE POLICY "Admins can manage hero media" 
        ON public.media_posts FOR ALL 
        USING (
            media_type = 'hero' AND 
            auth.jwt() ->> 'role' = 'admin'
        );
    END IF;
END $$;

-- 6. Create a function to ensure only one hero media is active at a time
CREATE OR REPLACE FUNCTION public.ensure_single_active_hero()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a hero media being set to active
    IF NEW.media_type = 'hero' AND NEW.is_active = true THEN
        -- Deactivate all other hero media
        UPDATE public.media_posts 
        SET is_active = false 
        WHERE media_type = 'hero' 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically manage active hero media
DROP TRIGGER IF EXISTS trigger_ensure_single_active_hero ON public.media_posts;
CREATE TRIGGER trigger_ensure_single_active_hero
    BEFORE INSERT OR UPDATE ON public.media_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_active_hero();

-- 8. Add helpful comments
COMMENT ON COLUMN public.media_posts.is_active IS 'Indicates if this media is currently active (used for hero media)';
COMMENT ON INDEX idx_media_posts_type_active IS 'Index for efficient media type and active status queries';
COMMENT ON INDEX idx_media_posts_hero_active IS 'Index for efficient hero media active status queries';
COMMENT ON FUNCTION public.ensure_single_active_hero() IS 'Ensures only one hero media can be active at a time';

-- 9. Insert a sample hero media (optional - remove if not needed)
-- INSERT INTO public.media_posts (
--     title, 
--     caption, 
--     media_type, 
--     media_url, 
--     is_active,
--     likes
-- ) VALUES (
--     'Default Hero Image',
--     'Professional photography services for weddings, events, and portraits. Creating memories that last a lifetime.',
--     'hero',
--     'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920',
--     true,
--     0
-- ) ON CONFLICT DO NOTHING;

-- 10. Verification queries (for testing)
-- SELECT 'Migration completed successfully' as status;
-- SELECT COUNT(*) as total_media_posts FROM public.media_posts;
-- SELECT COUNT(*) as hero_media_count FROM public.media_posts WHERE media_type = 'hero';
-- SELECT COUNT(*) as active_hero_count FROM public.media_posts WHERE media_type = 'hero' AND is_active = true;