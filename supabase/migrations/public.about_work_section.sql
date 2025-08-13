create table public.about_work_section (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text not null,
  youtube_video_id text not null,
  video_title text not null,
  video_description text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint about_work_section_pkey primary key (id)
) TABLESPACE pg_default;

create trigger handle_updated_at_about_work_section BEFORE
update on about_work_section for EACH row
execute FUNCTION handle_updated_at ();

create trigger trigger_ensure_single_active_about_work BEFORE INSERT
or
update on about_work_section for EACH row
execute FUNCTION ensure_single_active_about_work ();