-- Performance Advisor: "Auth RLS Initialization Plan". A policy that calls auth.uid() directly re-evaluates it
-- for every row; wrapped as (select auth.uid()) Postgres computes it once per query. Same rules, faster.
-- Rewrites every policy in the public schema that still calls it bare (already-wrapped ones are left alone),
-- so it is safe to run more than once.

do $$
declare
  p record;
  q text;
  c text;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
  loop
    q := p.qual;
    c := p.with_check;
    if q is not null and q not like '%SELECT auth.uid()%' then
      q := replace(q, 'auth.uid()', '(select auth.uid())');
    end if;
    if c is not null and c not like '%SELECT auth.uid()%' then
      c := replace(c, 'auth.uid()', '(select auth.uid())');
    end if;
    if q is not distinct from p.qual and c is not distinct from p.with_check then
      continue;
    end if;

    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then
      stmt := stmt || format(' using (%s)', q);
    end if;
    if c is not null then
      stmt := stmt || format(' with check (%s)', c);
    end if;
    execute stmt;
  end loop;
end
$$;
