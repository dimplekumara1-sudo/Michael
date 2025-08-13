create table public.galleries (
  id uuid not null default extensions.uuid_generate_v4 (),
  booking_id uuid not null,
  title text not null,
  media_urls text[] null default '{}'::text[],
  is_public boolean null default false,
  mega_link text not null,
  qr_code_data text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint galleries_pkey primary key (id),
  constraint galleries_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_galleries_booking_id on public.galleries using btree (booking_id) TABLESPACE pg_default;

create index IF not exists idx_galleries_is_public on public.galleries using btree (is_public) TABLESPACE pg_default;

create trigger handle_updated_at_galleries BEFORE
update on galleries for EACH row
execute FUNCTION handle_updated_at ();