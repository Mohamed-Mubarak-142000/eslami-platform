-- The app's settings per account (adhan, reminders, prayer calculation, location, reading), so they
-- follow the user to a new phone and the app can tell who hasn't finished setting up. One row per
-- user; the app writes the whole object (last write wins on updated_at). Server-side reminder jobs
-- keep reading profiles.remind_* and email_updates, which stay where they are.

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 16384),
  -- Set when the user saved the settings screen at least once ("setup complete").
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences: own read" on public.user_preferences for select to authenticated using (user_id = auth.uid());
create policy "user_preferences: own insert" on public.user_preferences for insert to authenticated with check (user_id = auth.uid());
create policy "user_preferences: own update" on public.user_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_preferences: own delete" on public.user_preferences for delete to authenticated using (user_id = auth.uid());
