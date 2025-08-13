create table public.contact_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  email text not null,
  message text not null,
  status public.message_status null default 'unread'::message_status,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint contact_messages_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_contact_messages_status on public.contact_messages using btree (status) TABLESPACE pg_default;

create index IF not exists idx_contact_messages_created_at on public.contact_messages using btree (created_at) TABLESPACE pg_default;

create trigger handle_updated_at_contact_messages BEFORE
update on contact_messages for EACH row
execute FUNCTION handle_updated_at ();