-- Who saw each "نفحة": a signed-in reader is recorded once per post, the first time it shows on their screen
-- (in the channel, or in the dialog / app prompt). Admins read the list on /admin/nafahat; readers only
-- their own rows. Removed with the post by the monthly cleanup (on delete cascade).

create table public.nafahat_views (
  nafha_id uuid not null references public.nafahat (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (nafha_id, user_id)
);
create index nafahat_views_user_idx on public.nafahat_views (user_id);

alter table public.nafahat_views enable row level security;

create policy "nafahat_views: insert own" on public.nafahat_views for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "nafahat_views: read own or admin" on public.nafahat_views for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
