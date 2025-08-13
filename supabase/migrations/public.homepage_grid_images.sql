-- Homepage Grid Images Management
-- Table to manage homepage grid and the slider row used inside GridGallery

-- 1) Create enum for section types if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'homepage_section'
  ) THEN
    CREATE TYPE public.homepage_section AS ENUM ('grid', 'slider');
  END IF;
END $$;

-- 2) Create table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'homepage_grid_images'
  ) THEN
    CREATE TABLE public.homepage_grid_images (
      id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      image_url text NOT NULL,
      title text NULL,
      section public.homepage_section NOT NULL DEFAULT 'grid',
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );
  END IF;
END $$;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_homepage_grid_images_section ON public.homepage_grid_images(section);
CREATE INDEX IF NOT EXISTS idx_homepage_grid_images_sort ON public.homepage_grid_images(section, sort_order);

-- 4) Enable RLS and policies
ALTER TABLE public.homepage_grid_images ENABLE ROW LEVEL SECURITY;

-- Public read access (anon) to allow homepage rendering without auth
DROP POLICY IF EXISTS "Public read homepage grid images" ON public.homepage_grid_images;
CREATE POLICY "Public read homepage grid images"
  ON public.homepage_grid_images FOR SELECT
  USING (true);

-- Admin full access policy (based on profiles.role = 'admin')
DROP POLICY IF EXISTS "Admins manage homepage grid images" ON public.homepage_grid_images;
CREATE POLICY "Admins manage homepage grid images"
  ON public.homepage_grid_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Grants
GRANT SELECT ON public.homepage_grid_images TO anon;
GRANT ALL ON public.homepage_grid_images TO authenticated;
GRANT ALL ON public.homepage_grid_images TO service_role;

-- 5) Seed with current hardcoded homepage GridGallery content
-- Grid rows (2 + 3 + 3 = 8 images)
INSERT INTO public.homepage_grid_images (image_url, title, section, sort_order)
SELECT * FROM (VALUES
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-1.jpeg', NULL, 'grid'::homepage_section, 1),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-5.jpeg', NULL, 'grid'::homepage_section, 2),

  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-9.jpeg', NULL, 'grid'::homepage_section, 3),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-8.jpeg', NULL, 'grid'::homepage_section, 4),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-7.jpeg', NULL, 'grid'::homepage_section, 5),

  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-6.jpeg', NULL, 'grid'::homepage_section, 6),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-photos-4.jpeg', NULL, 'grid'::homepage_section, 7),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-07.jpeg', NULL, 'grid'::homepage_section, 8)
) v(url, title, section, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_grid_images WHERE section = 'grid'
);

-- Slider init images (unique set, front-end will duplicate to loop)
INSERT INTO public.homepage_grid_images (image_url, title, section, sort_order)
SELECT * FROM (VALUES
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-11.jpeg', NULL, 'slider'::homepage_section, 1),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-09.jpeg', NULL, 'slider'::homepage_section, 2),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-08.jpeg', NULL, 'slider'::homepage_section, 3),
  ('https://35mmarts.com/wp-content/uploads/2024/06/35mmarts-06-1.jpg', NULL, 'slider'::homepage_section, 4)
) v(url, title, section, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_grid_images WHERE section = 'slider'
);

-- 6) Success message
DO $$
BEGIN
  RAISE NOTICE '✅ homepage_grid_images table ready and seeded.';
END $$;