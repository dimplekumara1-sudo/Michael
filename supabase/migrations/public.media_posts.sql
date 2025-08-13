create table public.media_posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  caption text not null,
  media_type public.media_type not null,
  media_url text not null,
  thumbnail text null,
  likes integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  is_active boolean null default false,
  location text null,
  youtube_url text null,
  category text null default 'All Work'::text,
  media_urls text[] null,
  thumbnails text[] null,
  constraint media_posts_pkey primary key (id),
  constraint check_max_media_urls check ((array_length(media_urls, 1) <= 3)),
  constraint check_max_thumbnails check ((array_length(thumbnails, 1) <= 3)),
  constraint check_media_urls_not_empty check (
    (
      (media_urls is null)
      or (array_length(media_urls, 1) > 0)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_media_posts_media_type on public.media_posts using btree (media_type) TABLESPACE pg_default;

create index IF not exists idx_media_posts_created_at on public.media_posts using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_media_posts_type_active on public.media_posts using btree (media_type, is_active) TABLESPACE pg_default;

create index IF not exists idx_media_posts_hero_active on public.media_posts using btree (is_active) TABLESPACE pg_default
where
  (media_type = 'hero'::media_type);

create index IF not exists idx_media_posts_media_urls_gin on public.media_posts using gin (media_urls) TABLESPACE pg_default;

create trigger handle_updated_at_media_posts BEFORE
update on media_posts for EACH row
execute FUNCTION handle_updated_at ();

create trigger trigger_ensure_single_active_hero BEFORE INSERT
or
update on media_posts for EACH row
execute FUNCTION ensure_single_active_hero ();