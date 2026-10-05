-- Expo push tokens of the mobile app (separate repo, same backend). The app registers its own token
-- with the user's session; the server (service role) reads them to send reminder pushes and drops
-- tokens Expo reports as no longer registered.

create table public.push_tokens (
  token text primary key check (token like 'ExponentPushToken[%' or token like 'ExpoPushToken[%'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- A device token moves to whoever signs in on that device, so upsert must be able to take it over:
-- insert/update require the row to end up owned by the caller.
create policy "push_tokens: read own" on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy "push_tokens: insert own" on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy "push_tokens: update to own" on public.push_tokens for update to authenticated using (true) with check (user_id = auth.uid());
create policy "push_tokens: delete own" on public.push_tokens for delete to authenticated using (user_id = auth.uid());
