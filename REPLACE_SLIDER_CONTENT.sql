-- =====================================================
-- REPLACE SLIDER CONTENT WITH NEW PORTFOLIO ITEMS
-- =====================================================
-- This script will:
-- 1. Delete all existing slider posts
-- 2. Insert new slider content with proper format
-- 3. Set all new items as active
-- =====================================================

BEGIN;

-- Step 1: Delete all existing slider posts
DELETE FROM media_posts 
WHERE media_type = 'slider';

-- Step 2: Insert new slider content
INSERT INTO media_posts (
    title, 
    caption, 
    media_type, 
    media_url, 
    thumbnail, 
    is_active,
    likes
) VALUES 
-- Wedding
(
    'Wedding',
    'THE BIG DAY - Capturing your special day with artistic flair and attention to every precious detail',
    'slider',
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
),
-- Films
(
    'FILMS',
    'CREATIVITY SHOW - Professional film production and creative storytelling',
    'slider',
    'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
),
-- Outdoors
(
    'Outdoors',
    'BEGINNING OF A JOURNEY - Nature and outdoor photography adventures',
    'slider',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
),
-- Corporate
(
    'Corporate',
    'PROFESSIONAL EXCELLENCE - Corporate events and professional photography',
    'slider',
    'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
),
-- Portrait
(
    'Portrait',
    'PERSONAL STORIES - Individual and family portrait sessions',
    'slider',
    'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
),
-- Events
(
    'Events',
    'MEMORABLE MOMENTS - Special events and celebration photography',
    'slider',
    'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=400',
    true,
    0
);

-- Step 3: Verify the insertion
SELECT 
    id,
    title,
    caption,
    media_url,
    is_active,
    created_at
FROM media_posts 
WHERE media_type = 'slider'
ORDER BY created_at ASC;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check total count of slider posts
SELECT COUNT(*) as total_slider_posts 
FROM media_posts 
WHERE media_type = 'slider';

-- Check active slider posts
SELECT COUNT(*) as active_slider_posts 
FROM media_posts 
WHERE media_type = 'slider' AND is_active = true;

-- Display all slider posts with details
SELECT 
    title,
    CASE 
        WHEN LENGTH(caption) > 50 
        THEN CONCAT(SUBSTRING(caption, 1, 50), '...')
        ELSE caption 
    END as caption_preview,
    is_active,
    created_at
FROM media_posts 
WHERE media_type = 'slider'
ORDER BY created_at ASC;