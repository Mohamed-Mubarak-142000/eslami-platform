-- Admin announcement emails ("a new feature is live"): who opted out, the site's Facebook page
-- shown in every email, and a log of each send.

alter table public.profiles
  add column email_updates boolean not null default true;

alter table public.app_settings
  add column facebook_url text check (facebook_url is null or facebook_url ~ '^https://([a-z0-9-]+\.)?(facebook|fb)\.com/');

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 3 and 150),
  -- The structured sections the email template renders (title, intro, steps, benefits, button...).
  content jsonb not null,
  sent_by uuid references public.profiles (id) on delete set null,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index announcements_created_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

-- Written only by the server (service role) while sending; admins can read the log.
create policy "announcements: admin read" on public.announcements for select to authenticated using (public.is_admin());
