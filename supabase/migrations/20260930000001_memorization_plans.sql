-- Memorization plans: a learner picks a run of juz and a daily amount; each day the site shows
-- the new portion plus a review wird (recent pages + a rotating slice of older ones).
-- Amounts are counted in half-page units of the Madani mushaf, so "half a page a day" is exact.

create table public.memorization_plans (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  start_juz smallint not null check (start_juz between 1 and 30),
  end_juz smallint not null check (end_juz between 1 and 30),
  start_page smallint not null check (start_page between 1 and 604),
  end_page smallint not null check (end_page between 1 and 604),
  units_per_day smallint not null check (units_per_day between 1 and 10),
  far_review_pages smallint not null default 2 check (far_review_pages between 0 and 20),
  -- Half-pages memorized so far; the plan advances by completion, not by date.
  progress_units integer not null default 0 check (progress_units >= 0),
  -- Position of the rotating "older pages" review.
  review_cursor integer not null default 0 check (review_cursor >= 0),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (start_juz <= end_juz),
  check (start_page <= end_page),
  check (progress_units <= (end_page - start_page + 1) * 2)
);
create unique index memorization_plans_one_active on public.memorization_plans (learner_id) where status = 'active';
create index memorization_plans_learner_idx on public.memorization_plans (learner_id, created_at desc);

-- One row per plan, day and kind: makes "done today" idempotent and gives the streak.
create table public.memorization_plan_log (
  plan_id uuid not null references public.memorization_plans (id) on delete cascade,
  learner_id uuid not null references public.learners (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('new', 'review')),
  from_unit integer not null check (from_unit >= 0),
  to_unit integer not null check (to_unit >= from_unit),
  done_at timestamptz not null default now(),
  primary key (plan_id, day, kind)
);
create index memorization_plan_log_learner_idx on public.memorization_plan_log (learner_id, day desc);

alter table public.memorization_plans enable row level security;
alter table public.memorization_plan_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['memorization_plans', 'memorization_plan_log'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select using (public.owns_learner(learner_id) or public.is_admin())', t);
    execute format('create policy "%1$s: insert" on public.%1$I for insert with check (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: update" on public.%1$I for update using (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: delete" on public.%1$I for delete using (public.owns_learner(learner_id))', t);
  end loop;
end $$;
