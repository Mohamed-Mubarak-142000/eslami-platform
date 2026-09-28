-- Kids story videos (YouTube embeds curated by admins) and which child watched which story.

create table public.kids_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  prophet text check (prophet is null or char_length(prophet) <= 40),
  youtube_id text not null unique check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  summary text not null default '' check (char_length(summary) <= 500),
  lesson text not null default '' check (char_length(lesson) <= 300),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index kids_stories_order_idx on public.kids_stories (sort_order, created_at);

create table public.story_views (
  learner_id uuid not null references public.learners (id) on delete cascade,
  story_id uuid not null references public.kids_stories (id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (learner_id, story_id)
);

alter table public.kids_stories enable row level security;
alter table public.story_views enable row level security;

create policy "kids_stories: read published or admin" on public.kids_stories for select to authenticated using (published or public.is_admin());
create policy "kids_stories: admin insert" on public.kids_stories for insert to authenticated with check (public.is_admin());
create policy "kids_stories: admin update" on public.kids_stories for update to authenticated using (public.is_admin());
create policy "kids_stories: admin delete" on public.kids_stories for delete to authenticated using (public.is_admin());

create policy "story_views: read" on public.story_views for select using (public.owns_learner(learner_id) or public.is_admin());
create policy "story_views: insert" on public.story_views for insert with check (public.owns_learner(learner_id));
create policy "story_views: update" on public.story_views for update using (public.owns_learner(learner_id));
create policy "story_views: delete" on public.story_views for delete using (public.owns_learner(learner_id));
