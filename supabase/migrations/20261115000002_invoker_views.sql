-- Security Advisor: "Security Definer View" (critical) on public_supporters and nafahat_reaction_counts.
-- Both views ran as their owner so anonymous visitors could see a safe slice of an RLS-protected table.
-- They now run as the caller (security_invoker) and read that slice from a security definer function in
-- the "private" schema, which the API does not expose: same names, same columns, so the website and every
-- installed version of the app keep working unchanged.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- Approved supporters: the shown name and message only, never the amount, the receipt or who the user is.
create or replace function private.public_supporters()
returns table (id uuid, name text, message text, approved_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.id,
         case when s.show_name then s.display_name else 'فاعل خير' end,
         s.message,
         s.reviewed_at
  from public.supporters s
  where s.status = 'approved'
  order by s.reviewed_at desc nulls last;
$$;
revoke all on function private.public_supporters() from public;
grant execute on function private.public_supporters() to anon, authenticated;

create or replace view public.public_supporters as
  select id, name, message, approved_at from private.public_supporters();
alter view public.public_supporters set (security_invoker = on);
revoke all on public.public_supporters from public;
grant select on public.public_supporters to anon, authenticated;

-- Reactions per post and emoji, without who reacted.
create or replace function private.nafahat_reaction_counts()
returns table (nafha_id uuid, emoji text, count int)
language sql stable security definer set search_path = ''
as $$
  select r.nafha_id, r.emoji, count(*)::int
  from public.nafahat_reactions r
  group by r.nafha_id, r.emoji;
$$;
revoke all on function private.nafahat_reaction_counts() from public;
grant execute on function private.nafahat_reaction_counts() to anon, authenticated;

create or replace view public.nafahat_reaction_counts as
  select nafha_id, emoji, count from private.nafahat_reaction_counts();
alter view public.nafahat_reaction_counts set (security_invoker = on);
revoke all on public.nafahat_reaction_counts from public;
grant select on public.nafahat_reaction_counts to anon, authenticated;
