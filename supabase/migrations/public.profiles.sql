create table public.profiles (
  id uuid not null,
  name text null,
  email text not null,
  role public.user_role null default 'user'::user_role,
  avatar text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  mobile text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_profiles_role on public.profiles using btree (role) TABLESPACE pg_default;

create index IF not exists idx_profiles_email_lookup on public.profiles using btree (email) TABLESPACE pg_default;

create trigger handle_updated_at_profiles BEFORE
update on profiles for EACH row
execute FUNCTION handle_updated_at ();