-- Scheduled reminder emails for special days (Friday & Surat al-Kahf, Monday/Thursday fasting,
-- the white days, and the yearly seasons). Opted into separately from feature announcements, per
-- topic, so turning off the frequent fasting reminders keeps the Friday one.

alter table public.profiles
  add column remind_friday boolean not null default true,
  add column remind_fasting boolean not null default true,
  add column remind_seasons boolean not null default true;

alter table public.app_settings
  add column reminders_enabled boolean not null default true,
  -- Umm al-Qura is a computed calendar; local moon sighting can start a month a day early or late.
  add column hijri_offset smallint not null default 0 check (hijri_offset between -2 and 2),
  add column disabled_occasions text[] not null default '{}';

-- One row per occasion per day: the unique key is what stops a retried cron from sending twice.
create table public.reminder_runs (
  id uuid primary key default gen_random_uuid(),
  occasion_key text not null,
  run_date date not null,
  slot text not null check (slot in ('morning', 'evening')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  status text not null default 'running' check (status in ('running', 'done', 'quota')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (occasion_key, run_date)
);
create index reminder_runs_started_idx on public.reminder_runs (started_at desc);

-- Who already got a run's email, so a run cut short by the time limit resumes where it stopped.
create table public.reminder_deliveries (
  run_id uuid not null references public.reminder_runs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (run_id, user_id)
);

alter table public.reminder_runs enable row level security;
alter table public.reminder_deliveries enable row level security;

-- Written only by the server (service role) while sending; admins can read the log.
create policy "reminder_runs: admin read" on public.reminder_runs for select to authenticated using (public.is_admin());
create policy "reminder_deliveries: admin read" on public.reminder_deliveries for select to authenticated using (public.is_admin());
