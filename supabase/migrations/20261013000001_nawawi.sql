-- The Forty Nawawi Hadiths course: four part exams (hadiths 1–10, 11–20, 21–30, 31–42) and a final
-- exam that opens once all four are passed; passing the final issues the learner's certificate.
-- Kept apart from the juz exams (exam_attempts, certificates), whose rows all name a juz. Like them,
-- these rows are written only by the server with the service role; owners and admins read them.

create table public.nawawi_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  -- 1–4: a part's exam; 5: the final exam over all 42 hadiths.
  part smallint not null check (part between 1 and 5),
  questions jsonb not null,
  answers jsonb,
  score integer,
  total integer not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'passed', 'failed', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz
);
create index nawawi_attempts_learner_idx on public.nawawi_attempts (learner_id, part, started_at desc);

create table public.nawawi_answer_keys (
  attempt_id uuid primary key references public.nawawi_attempts (id) on delete cascade,
  key jsonb not null
);

create table public.nawawi_certificates (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null unique references public.learners (id) on delete cascade,
  holder_name text not null,
  score integer not null,
  total integer not null,
  attempt_id uuid references public.nawawi_attempts (id) on delete set null,
  verification_code text not null unique,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Public certificate check, like verify_certificate: only what the printed certificate shows.
create or replace function public.verify_nawawi_certificate(code text)
returns table (holder_name text, score integer, total integer, issued_at timestamptz, revoked boolean)
language sql stable security definer set search_path = public as $$
  select c.holder_name, c.score, c.total, c.issued_at, c.revoked_at is not null
  from public.nawawi_certificates c where c.verification_code = upper(code);
$$;
grant execute on function public.verify_nawawi_certificate(text) to anon, authenticated;

alter table public.nawawi_attempts enable row level security;
alter table public.nawawi_answer_keys enable row level security; -- no policies: service role only
alter table public.nawawi_certificates enable row level security;

create policy "nawawi_attempts: read own or admin" on public.nawawi_attempts for select
  using (public.owns_learner(learner_id) or public.is_admin());
create policy "nawawi_certificates: read own or admin" on public.nawawi_certificates for select
  using (public.owns_learner(learner_id) or public.is_admin());
create policy "nawawi_certificates: admin revoke" on public.nawawi_certificates for update using (public.is_admin());
