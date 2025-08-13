-- Multi-Image Posts Migration
-- This migration adds support for multiple images per post (up to 3 images)

-- Step 1: Add new columns for multiple images
ALTER TABLE public.media_posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS thumbnails TEXT[] DEFAULT NULL;

-- Step 2: Create a function to migrate existing single images to array format
CREATE OR REPLACE FUNCTION migrate_single_images_to_array()
RETURNS void AS $$
BEGIN
    -- Update existing posts to use array format
    UPDATE public.media_posts 
    SET 
        media_urls = ARRAY[media_url],
        thumbnails = CASE 
            WHEN thumbnail IS NOT NULL THEN ARRAY[thumbnail]
            ELSE NULL
        END
    WHERE media_urls IS NULL AND media_url IS NOT NULL;
    
    RAISE NOTICE 'Migration completed: Converted % posts to multi-image format', 
        (SELECT COUNT(*) FROM public.media_posts WHERE media_urls IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run the migration
SELECT migrate_single_images_to_array();

-- Step 4: Add constraints to ensure maximum 3 images per post
ALTER TABLE public.media_posts 
ADD CONSTRAINT check_max_media_urls 
CHECK (array_length(media_urls, 1) <= 3);

ALTER TABLE public.media_posts 
ADD CONSTRAINT check_max_thumbnails 
CHECK (array_length(thumbnails, 1) <= 3);

-- Step 5: Add constraint to ensure media_urls is not empty when provided
ALTER TABLE public.media_posts 
ADD CONSTRAINT check_media_urls_not_empty 
CHECK (media_urls IS NULL OR array_length(media_urls, 1) > 0);

-- Step 6: Create index for better performance on array queries
CREATE INDEX IF NOT EXISTS idx_media_posts_media_urls_gin 
ON public.media_posts USING gin(media_urls);

-- Step 7: Update the trigger function to handle array fields (if needed)
-- Note: The existing triggers should continue to work as they don't directly interact with the new fields

-- Step 8: Add a helper function to get the primary image (first in array or fallback to media_url)
CREATE OR REPLACE FUNCTION get_primary_media_url(post_row public.media_posts)
RETURNS TEXT AS $$
BEGIN
    -- Return first image from array if available
    IF post_row.media_urls IS NOT NULL AND array_length(post_row.media_urls, 1) > 0 THEN
        RETURN post_row.media_urls[1];
    END IF;
    
    -- Fallback to single media_url for backward compatibility
    RETURN post_row.media_url;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add a helper function to get the primary thumbnail
CREATE OR REPLACE FUNCTION get_primary_thumbnail(post_row public.media_posts)
RETURNS TEXT AS $$
BEGIN
    -- Return first thumbnail from array if available
    IF post_row.thumbnails IS NOT NULL AND array_length(post_row.thumbnails, 1) > 0 THEN
        RETURN post_row.thumbnails[1];
    END IF;
    
    -- Fallback to single thumbnail for backward compatibility
    RETURN post_row.thumbnail;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a view for easier querying with computed fields
CREATE OR REPLACE VIEW media_posts_with_computed AS
SELECT 
    *,
    get_primary_media_url(media_posts.*) as primary_media_url,
    get_primary_thumbnail(media_posts.*) as primary_thumbnail,
    CASE 
        WHEN media_urls IS NOT NULL THEN array_length(media_urls, 1)
        ELSE 1
    END as image_count
FROM public.media_posts;

-- Verification queries
SELECT 
    'Migration Summary' as status,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN media_urls IS NOT NULL THEN 1 END) as posts_with_arrays,
    COUNT(CASE WHEN array_length(media_urls, 1) > 1 THEN 1 END) as multi_image_posts
FROM public.media_posts;

-- Show sample of migrated data
SELECT 
    id,
    title,
    media_url as old_single_url,
    media_urls as new_array_urls,
    thumbnail as old_single_thumbnail,
    thumbnails as new_array_thumbnails,
    array_length(media_urls, 1) as image_count
FROM public.media_posts 
WHERE media_type = 'latest_work'
LIMIT 5;