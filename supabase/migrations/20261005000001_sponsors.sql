-- Hand-picked sponsors for one tasteful card on the mobile app's home screen (never on Quran or kids
-- screens). No ad network: rows are added by the team in the Supabase dashboard, each with a date range.

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  -- One short line: "الشهر ده برعاية …" style copy.
  message text not null check (char_length(message) between 2 and 160),
  link_url text check (link_url is null or link_url like 'https://%'),
  logo_url text check (logo_url is null or logo_url like 'https://%'),
  starts_on date not null,
  ends_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index sponsors_window_idx on public.sponsors (starts_on, ends_on) where active;

alter table public.sponsors enable row level security;

-- Anyone (signed in or not) can read the sponsors that are running; only admins write.
create policy "sponsors: read running" on public.sponsors for select using (active and current_date between starts_on and ends_on);
create policy "sponsors: admin read" on public.sponsors for select to authenticated using (public.is_admin());
create policy "sponsors: admin write" on public.sponsors for all to authenticated using (public.is_admin()) with check (public.is_admin());
