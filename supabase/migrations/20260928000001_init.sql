-- Al-Manara — initial schema: profiles, learners (self + children), synced progress,
-- تسميع sessions, server-graded juz exams, certificates, admin settings.
-- Every progress row is keyed by learner_id; row-level security ties a learner to its owner.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  certificate_name text not null default '',
  role public.app_role not null default 'user',
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('self', 'child')),
  display_name text not null check (char_length(display_name) between 1 and 60),
  birth_year smallint check (birth_year between 1900 and 2100),
  created_at timestamptz not null default now()
);
create unique index learners_one_self_per_owner on public.learners (owner_id) where kind = 'self';
create index learners_owner_idx on public.learners (owner_id);

-- Security-definer helpers (bypass RLS internally; safe because they only answer yes/no).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not disabled);
$$;

create or replace function public.owns_learner(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learners where id = target and owner_id = auth.uid());
$$;

-- New auth user → profile + a "self" learner.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  name text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, email, full_name, certificate_name) values (new.id, new.email, name, name);
  insert into public.learners (owner_id, kind, display_name) values (new.id, 'self', left(name, 60));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Users may edit their own names, never their role/disabled flag.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for the SQL editor and the service role (trusted server contexts).
  if auth.uid() is not null and not public.is_admin() and (new.role is distinct from old.role or new.disabled is distinct from old.disabled) then
    raise exception 'not allowed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- Keep the self learner's name in sync with the profile name.
create or replace function public.sync_self_learner_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.full_name is distinct from old.full_name and new.full_name <> '' then
    update public.learners set display_name = left(new.full_name, 60) where owner_id = new.id and kind = 'self';
  end if;
  return new;
end;
$$;
create trigger profiles_sync_self after update on public.profiles for each row execute function public.sync_self_learner_name();

-- ---------------------------------------------------------------------------
-- Progress
-- ---------------------------------------------------------------------------
create table public.memorized_ayahs (
  learner_id uuid not null references public.learners (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah between 1 and 286),
  memorized_at timestamptz not null default now(),
  primary key (learner_id, surah, ayah)
);

create table public.review_schedule (
  learner_id uuid not null references public.learners (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  interval_index smallint not null default 0,
  last_reviewed_at timestamptz not null default now(),
  due_at timestamptz not null,
  primary key (learner_id, surah)
);

create table public.reading_position (
  learner_id uuid primary key references public.learners (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  surah_name text not null default '',
  page smallint not null check (page between 1 and 604),
  updated_at timestamptz not null default now()
);

create table public.activity_days (
  learner_id uuid not null references public.learners (id) on delete cascade,
  day date not null,
  primary key (learner_id, day)
);

create table public.game_sessions (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.learners (id) on delete cascade,
  game text not null check (game in ('letters', 'tajweed', 'arrange', 'quiz')),
  surah smallint check (surah between 1 and 114),
  score integer not null default 0 check (score >= 0),
  total integer not null default 0 check (total >= 0),
  stars smallint check (stars between 0 and 3),
  moves integer,
  created_at timestamptz not null default now()
);
create index game_sessions_learner_idx on public.game_sessions (learner_id, created_at desc);

create table public.listen_completions (
  learner_id uuid not null references public.learners (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  completed_at timestamptz not null default now(),
  primary key (learner_id, surah)
);

create table public.learner_badges (
  learner_id uuid not null references public.learners (id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (learner_id, badge_id)
);

create table public.tasmee_sessions (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.learners (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah_from smallint not null,
  ayah_to smallint not null,
  correct integer not null default 0 check (correct >= 0),
  mistakes integer not null default 0 check (mistakes >= 0),
  created_at timestamptz not null default now(),
  check (ayah_to >= ayah_from)
);
create index tasmee_sessions_learner_idx on public.tasmee_sessions (learner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Exams & certificates (written only by the server with the service role)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),
  exam_question_count smallint not null default 20 check (exam_question_count between 5 and 60),
  exam_pass_percent smallint not null default 80 check (exam_pass_percent between 50 and 100),
  exam_minutes smallint not null default 30 check (exam_minutes between 5 and 180),
  retry_cooldown_hours smallint not null default 24 check (retry_cooldown_hours between 0 and 720),
  updated_at timestamptz not null default now()
);
insert into public.app_settings default values;

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  juz smallint not null check (juz between 1 and 30),
  questions jsonb not null,
  answers jsonb,
  score integer,
  total integer not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'passed', 'failed', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz
);
create index exam_attempts_learner_idx on public.exam_attempts (learner_id, juz, started_at desc);

create table public.exam_answer_keys (
  attempt_id uuid primary key references public.exam_attempts (id) on delete cascade,
  key jsonb not null
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  juz smallint not null check (juz between 1 and 30),
  holder_name text not null,
  score integer not null,
  total integer not null,
  exam_attempt_id uuid references public.exam_attempts (id) on delete set null,
  verification_code text not null unique,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (learner_id, juz)
);

-- Public certificate check: exposes only what a printed certificate already shows.
create or replace function public.verify_certificate(code text)
returns table (holder_name text, juz smallint, score integer, total integer, issued_at timestamptz, revoked boolean)
language sql stable security definer set search_path = public as $$
  select c.holder_name, c.juz, c.score, c.total, c.issued_at, c.revoked_at is not null
  from public.certificates c where c.verification_code = upper(code);
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.learners enable row level security;
alter table public.memorized_ayahs enable row level security;
alter table public.review_schedule enable row level security;
alter table public.reading_position enable row level security;
alter table public.activity_days enable row level security;
alter table public.game_sessions enable row level security;
alter table public.listen_completions enable row level security;
alter table public.learner_badges enable row level security;
alter table public.tasmee_sessions enable row level security;
alter table public.app_settings enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answer_keys enable row level security; -- no policies: service role only
alter table public.certificates enable row level security;

create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "learners: read own or admin" on public.learners for select using (owner_id = auth.uid() or public.is_admin());
create policy "learners: add children" on public.learners for insert with check (owner_id = auth.uid() and kind = 'child');
create policy "learners: edit own" on public.learners for update using (owner_id = auth.uid());
create policy "learners: remove own children" on public.learners for delete using (owner_id = auth.uid() and kind = 'child');

-- Owner reads/writes; admins read.
do $$
declare t text;
begin
  foreach t in array array['memorized_ayahs', 'review_schedule', 'reading_position', 'activity_days', 'listen_completions', 'learner_badges'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select using (public.owns_learner(learner_id) or public.is_admin())', t);
    execute format('create policy "%1$s: insert" on public.%1$I for insert with check (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: update" on public.%1$I for update using (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: delete" on public.%1$I for delete using (public.owns_learner(learner_id))', t);
  end loop;
  foreach t in array array['game_sessions', 'tasmee_sessions'] loop
    execute format('create policy "%1$s: read" on public.%1$I for select using (public.owns_learner(learner_id) or public.is_admin())', t);
    execute format('create policy "%1$s: insert" on public.%1$I for insert with check (public.owns_learner(learner_id))', t);
    execute format('create policy "%1$s: delete" on public.%1$I for delete using (public.owns_learner(learner_id))', t);
  end loop;
end $$;

create policy "exam_attempts: read own or admin" on public.exam_attempts for select using (public.owns_learner(learner_id) or public.is_admin());
create policy "certificates: read own or admin" on public.certificates for select using (public.owns_learner(learner_id) or public.is_admin());
create policy "certificates: admin revoke" on public.certificates for update using (public.is_admin());
create policy "app_settings: read" on public.app_settings for select using (true);
create policy "app_settings: admin update" on public.app_settings for update using (public.is_admin());
