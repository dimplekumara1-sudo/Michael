create view public.media_posts_with_computed as
select
  id,
  title,
  caption,
  media_type,
  media_url,
  thumbnail,
  likes,
  created_at,
  updated_at,
  is_active,
  location,
  youtube_url,
  category,
  media_urls,
  thumbnails,
  get_primary_media_url (media_posts.*) as primary_media_url,
  get_primary_thumbnail (media_posts.*) as primary_thumbnail,
  case
    when media_urls is not null then array_length(media_urls, 1)
    else 1
  end as image_count
from
  media_posts;