create table public.post_likes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  media_post_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint post_likes_pkey primary key (id),
  constraint post_likes_user_id_media_post_id_key unique (user_id, media_post_id),
  constraint post_likes_media_post_id_fkey foreign KEY (media_post_id) references media_posts (id) on delete CASCADE,
  constraint post_likes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_likes_media_post_id on public.post_likes using btree (media_post_id) TABLESPACE pg_default;

create index IF not exists idx_post_likes_user_id on public.post_likes using btree (user_id) TABLESPACE pg_default;