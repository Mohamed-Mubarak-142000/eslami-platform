-- "نفحات المنارة": a read-only channel. Admins post a short reflection from /admin/nafahat (title, an optional
-- body, an optional image or video); everyone (signed in or not) reads it on the website (/nafahat) and in the
-- mobile app, and signed-in users react with one emoji per post. Posts and their files are removed every month
-- by the cron route /api/cron/nafahat-cleanup (vercel.json), so storage stays small.

create table public.nafahat (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  body text check (body is null or char_length(body) between 1 and 4000),
  media_type text check (media_type in ('image', 'video')),
  -- Public URL of the file in the "nafahat" bucket, and its path there (for deleting it).
  media_url text check (media_url is null or media_url like 'https://%'),
  media_path text check (media_path is null or char_length(media_path) between 3 and 200),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((media_type is null) = (media_url is null) and (media_url is null) = (media_path is null))
);
create index nafahat_created_idx on public.nafahat (created_at desc);

alter table public.nafahat enable row level security;

create policy "nafahat: read all" on public.nafahat for select using (true);
create policy "nafahat: admin write" on public.nafahat for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- One reaction per user per post; changing it is an upsert. References profiles so the admin page can
-- show who reacted (profiles(full_name, email)).
create table public.nafahat_reactions (
  nafha_id uuid not null references public.nafahat (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('heart', 'dua', 'star', 'like')),
  created_at timestamptz not null default now(),
  primary key (nafha_id, user_id)
);
create index nafahat_reactions_user_idx on public.nafahat_reactions (user_id);

alter table public.nafahat_reactions enable row level security;

create policy "nafahat_reactions: read own" on public.nafahat_reactions for select to authenticated using (user_id = auth.uid());
create policy "nafahat_reactions: admin read" on public.nafahat_reactions for select to authenticated using (public.is_admin());
create policy "nafahat_reactions: insert own" on public.nafahat_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "nafahat_reactions: update own" on public.nafahat_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "nafahat_reactions: delete own" on public.nafahat_reactions for delete to authenticated using (user_id = auth.uid());

-- Counts per post and emoji for everyone, without exposing who reacted. Runs as its owner.
create view public.nafahat_reaction_counts with (security_invoker = off) as
  select nafha_id, emoji, count(*)::int as count
  from public.nafahat_reactions
  group by nafha_id, emoji;

revoke all on public.nafahat_reaction_counts from public;
grant select on public.nafahat_reaction_counts to anon, authenticated;

-- Media: a public bucket, up to 50 MB per file. The admin's browser uploads straight to storage (a video is
-- far over the server-action and Vercel body limits), so admins get insert/delete policies here; the
-- monthly cleanup deletes with the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nafahat', 'nafahat', true, 52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "nafahat media: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'nafahat' and public.is_admin());
create policy "nafahat media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'nafahat' and public.is_admin());
