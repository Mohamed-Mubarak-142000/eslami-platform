-- Our own email codes (signup confirmation, password recovery, code sign-in), sent by the app
-- over SMTP instead of Supabase's mailer. Only HMAC hashes are stored; service role only.

create table public.email_otps (
  email text not null,
  purpose text not null check (purpose in ('signup', 'recovery', 'email')),
  code_hash text not null,
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (email, purpose)
);

alter table public.email_otps enable row level security; -- no policies: service role only
