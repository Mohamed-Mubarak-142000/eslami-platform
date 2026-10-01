-- Khatma: reading the whole Quran on a schedule. The learner either picks a daily amount
-- (pages, hizb, juz or surahs) or a finish date, plus the weekdays they read on. Separate from
-- memorization plans, so both can run at once.

create table public.khatmas (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  unit text not null check (unit in ('pages', 'hizb', 'juz', 'surah')),
  per_session smallint not null check (per_session between 1 and 604),
  mode text not null default 'amount' check (mode in ('amount', 'duration')),
  -- The finish date the learner asked for, in duration mode.
  target_day date,
  -- Weekdays, 0 = Sunday … 6 = Saturday.
  days smallint[] not null default '{0,1,2,3,4,5,6}' check (cardinality(days) > 0 and days <@ '{0,1,2,3,4,5,6}'::smallint[]),
  -- The next ayah to read, counted from 0 across the whole mushaf (6236 = finished).
  position smallint not null default 0 check (position between 0 and 6236),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (mode = 'amount' or target_day is not null)
);
create unique index khatmas_one_active on public.khatmas (learner_id) where status = 'active';
create index khatmas_learner_idx on public.khatmas (learner_id, created_at desc);

-- One row per khatma and day: "read today" is idempotent and gives the streak.
create table public.khatma_log (
  khatma_id uuid not null references public.khatmas (id) on delete cascade,
  learner_id uuid not null references public.learners (id) on delete cascade,
  day date not null,
  from_ayah smallint not null check (from_ayah between 0 and 6236),
  to_ayah smallint not null check (to_ayah between 0 and 6236 and to_ayah >= from_ayah),
  done_at timestamptz not null default now(),
  primary key (khatma_id, day)
);

alter table public.khatmas enable row level security;
alter table public.khatma_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['khatmas', 'khatma_log'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select using (public.owns_learner(learner_id) or public.is_admin())', t);
    execute format('create policy "%1$s: insert" on public.%1$I for insert with check (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: update" on public.%1$I for update using (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: delete" on public.%1$I for delete using (public.owns_learner(learner_id))', t);
  end loop;
end $$;
