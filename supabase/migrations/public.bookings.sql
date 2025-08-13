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
  project_value numeric(10, 2) null default 0.00,
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_bookings_user_id on public.bookings using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_event_date on public.bookings using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_created_at on public.bookings using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_bookings_project_value on public.bookings using btree (project_value) TABLESPACE pg_default;

create index IF not exists idx_bookings_event_date_status on public.bookings using btree (event_date, status) TABLESPACE pg_default;

create trigger handle_updated_at_bookings BEFORE
update on bookings for EACH row
execute FUNCTION handle_updated_at ();