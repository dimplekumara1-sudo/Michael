-- Latest Work Database Setup
-- Run this script in your Supabase SQL editor

-- 1. First, let's add the new columns to the existing media_posts table
ALTER TABLE media_posts 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'All Work';

-- 2. Create post_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_post_id UUID NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, media_post_id) -- Ensure one like per user per post
);

-- 3. Create post_comments table for user comments
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_post_id UUID NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_media_post_id ON post_likes(media_post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_media_post_id ON post_comments(media_post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_media_posts_type_active ON media_posts(media_type, is_active);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for post_likes
-- Allow users to view all likes
CREATE POLICY "Users can view all likes" ON post_likes
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "Users can insert their own likes" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for post_comments
-- Allow users to view all comments
CREATE POLICY "Users can view all comments" ON post_comments
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own comments
CREATE POLICY "Users can insert their own comments" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for post_comments updated_at
CREATE TRIGGER update_post_comments_updated_at 
    BEFORE UPDATE ON post_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create a view for posts with like and comment counts
CREATE OR REPLACE VIEW latest_work_with_stats AS
SELECT 
    mp.*,
    COALESCE(like_counts.like_count, 0) as like_count,
    COALESCE(comment_counts.comment_count, 0) as comment_count
FROM media_posts mp
LEFT JOIN (
    SELECT 
        media_post_id, 
        COUNT(*) as like_count
    FROM post_likes 
    GROUP BY media_post_id
) like_counts ON mp.id = like_counts.media_post_id
LEFT JOIN (
    SELECT 
        media_post_id, 
        COUNT(*) as comment_count
    FROM post_comments 
    GROUP BY media_post_id
) comment_counts ON mp.id = comment_counts.media_post_id
WHERE mp.media_type = 'latest_work';

-- 11. Grant necessary permissions
GRANT ALL ON post_likes TO authenticated;
GRANT ALL ON post_comments TO authenticated;
GRANT SELECT ON latest_work_with_stats TO authenticated;

-- 12. Create storage bucket for media files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Create storage policies for media bucket
CREATE POLICY "Public can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own media files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own media files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
    );

-- 14. Insert some sample data (optional - remove if not needed)
INSERT INTO media_posts (title, caption, media_type, media_url, thumbnail, location, youtube_url, category, likes, is_active)
VALUES 
    (
        'Wedding at Sunset Beach',
        'A beautiful wedding ceremony captured during golden hour at the beach. The couple exchanged vows as the sun set behind them, creating magical lighting for their special day.',
        'latest_work',
        'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
        'Sunset Beach, California',
        NULL,
        'Weddings',
        0,
        true
    ),
    (
        'Corporate Event Highlights',
        'Professional photography coverage of a major corporate event. Captured key moments, networking sessions, and presentations with attention to detail and lighting.',
        'latest_work',
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
        'Downtown Convention Center',
        NULL,
        'Corporate',
        0,
        true
    ),
    (
        'Behind the Scenes - Music Video',
        'Check out this behind-the-scenes footage from our latest music video shoot. Amazing collaboration with talented artists!',
        'latest_work',
        '',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        'Los Angeles Studio',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Events',
        0,
        true
    ),
    (
        'Executive Portrait Session',
        'Professional headshots and portraits for business executives. Clean, modern styling with professional lighting to capture confidence and approachability.',
        'latest_work',
        'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
        'Downtown Studio',
        NULL,
        'Portraits',
        0,
        true
    )
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Latest Work database setup completed successfully!' as message;