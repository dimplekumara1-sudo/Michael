create view public.user_profiles as
select
  id,
  COALESCE(
    raw_user_meta_data ->> 'name'::text,
    raw_user_meta_data ->> 'full_name'::text,
    split_part(email::text, '@'::text, 1),
    'User'::text
  ) as name,
  email,
  raw_user_meta_data ->> 'mobile'::text as mobile,
  case
    when email::text = 'admin@photography.com'::text then 'admin'::text
    else 'user'::text
  end as role,
  raw_user_meta_data ->> 'avatar_url'::text as avatar,
  created_at,
  updated_at
from
  auth.users u;


  create table public.bookings (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  event_date date not null,
  location text not null,
  event_type text not null,
  status public.booking_status null default 'pending'::booking_status,
  gallery_link text null,
  mega_link text null,
  qr_code text null,
  notes text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  mobile text null,
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint mobile_not_null check ((mobile is not null))
) TABLESPACE pg_default;

create index IF not exists idx_bookings_user_id on public.bookings using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_event_date on public.bookings using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_created_at on public.bookings using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;


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
  constraint media_posts_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_media_posts_media_type on public.media_posts using btree (media_type) TABLESPACE pg_default;

create index IF not exists idx_media_posts_created_at on public.media_posts using btree (created_at) TABLESPACE pg_default;
