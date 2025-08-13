-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    content_html TEXT NOT NULL,
    conclusion TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT false
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_is_published ON public.blogs(is_published);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read published blogs
CREATE POLICY "Anyone can view published blogs" ON public.blogs
    FOR SELECT USING (is_published = true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage all blogs" ON public.blogs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow authors to manage their own blogs
CREATE POLICY "Authors can manage their own blogs" ON public.blogs
    FOR ALL USING (author_id = auth.uid());

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER blogs_updated_at_trigger
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blogs_updated_at();

-- Insert some sample blog posts (optional)
INSERT INTO public.blogs (slug, title, description, thumbnail_url, content_html, conclusion, is_published, author_id) VALUES
(
    'welcome-to-micheal-photography',
    'Welcome to Micheal Photography',
    'Discover the art of capturing life''s most precious moments through the lens of professional photography.',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    '<p>Photography is more than just capturing images; it''s about freezing moments in time that tell a story. At Micheal Photography, we believe every photograph should evoke emotion and preserve memories that last a lifetime.</p><p>Our journey began with a simple passion for visual storytelling, and today we specialize in creating stunning portraits, capturing life''s milestones, and documenting the beauty of everyday moments.</p><p>Whether you''re looking for professional headshots, family portraits, or event photography, we bring creativity, technical expertise, and a personal touch to every session.</p>',
    'Thank you for visiting our blog. We look forward to sharing more insights about photography and helping you capture your most important moments.',
    true,
    (SELECT id FROM auth.users WHERE email = 'admin@micheal-photography.com' LIMIT 1)
),
(
    'tips-for-perfect-portrait-photography',
    'Tips for Perfect Portrait Photography',
    'Learn the essential techniques and tips for creating stunning portrait photographs that capture personality and emotion.',
    'https://images.unsplash.com/photo-1554048612-b6a482b224b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    '<p>Portrait photography is an art that requires both technical skill and the ability to connect with your subject. Here are some essential tips to help you create compelling portraits:</p><h3>1. Focus on the Eyes</h3><p>The eyes are the window to the soul, and they should be the sharpest part of your portrait. Always ensure the eyes are in perfect focus, even if other parts of the face are slightly soft.</p><h3>2. Use Natural Light When Possible</h3><p>Natural light, especially during golden hour, provides the most flattering illumination for portraits. Position your subject near a window or outdoors during the right time of day.</p><h3>3. Pay Attention to Background</h3><p>A cluttered background can distract from your subject. Choose simple, clean backgrounds that complement rather than compete with your subject.</p>',
    'Remember, great portrait photography is about capturing the essence of your subject. Practice these techniques, but don''t forget to let your creativity shine through.',
    true,
    (SELECT id FROM auth.users WHERE email = 'admin@micheal-photography.com' LIMIT 1)
);