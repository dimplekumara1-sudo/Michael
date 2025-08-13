create table public.post_comments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  media_post_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_media_post_id_fkey foreign KEY (media_post_id) references media_posts (id) on delete CASCADE,
  constraint post_comments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_comments_media_post_id on public.post_comments using btree (media_post_id) TABLESPACE pg_default;

create index IF not exists idx_post_comments_user_id on public.post_comments using btree (user_id) TABLESPACE pg_default;

create trigger update_post_comments_updated_at BEFORE
update on post_comments for EACH row
execute FUNCTION update_updated_at_column ();