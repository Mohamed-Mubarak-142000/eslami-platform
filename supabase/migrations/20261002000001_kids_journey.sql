-- Quran Garden journey: the companion a child picks, the daily challenge, and the surprise chests
-- and cosmetic items bought with gems. Gems themselves are never stored: the balance is computed
-- from progress minus the prices of owned items, so it cannot drift or be edited.

alter table public.game_sessions drop constraint if exists game_sessions_game_check;
alter table public.game_sessions
  add constraint game_sessions_game_check
  check (game in ('letters', 'tajweed', 'arrange', 'quiz', 'listen_pick', 'ayah_order', 'true_false', 'surah_match', 'kids_recite'));

create table public.kids_profile (
  learner_id uuid primary key references public.learners (id) on delete cascade,
  companion text check (companion in ('bear', 'panda', 'rabbit', 'fox')),
  equipped text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- One row per finished daily-challenge task; idempotent so a retry or a second tab is harmless.
create table public.kids_daily_tasks (
  learner_id uuid not null references public.learners (id) on delete cascade,
  day date not null,
  task_id text not null check (char_length(task_id) between 1 and 40),
  done_at timestamptz not null default now(),
  primary key (learner_id, day, task_id)
);

-- Bought items (kind 'item', ref_id = item id) and opened chests (kind 'chest', ref_id = chest id,
-- reward_id = what came out of it).
create table public.kids_rewards (
  learner_id uuid not null references public.learners (id) on delete cascade,
  kind text not null check (kind in ('item', 'chest')),
  ref_id text not null check (char_length(ref_id) between 1 and 40),
  reward_id text check (char_length(reward_id) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (learner_id, kind, ref_id)
);

alter table public.kids_profile enable row level security;
alter table public.kids_daily_tasks enable row level security;
alter table public.kids_rewards enable row level security;

do $$
declare t text;
begin
  foreach t in array array['kids_profile', 'kids_daily_tasks', 'kids_rewards'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select using (public.owns_learner(learner_id) or public.is_admin())', t);
    execute format('create policy "%1$s: insert" on public.%1$I for insert with check (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: update" on public.%1$I for update using (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: delete" on public.%1$I for delete using (public.owns_learner(learner_id))', t);
  end loop;
end $$;
