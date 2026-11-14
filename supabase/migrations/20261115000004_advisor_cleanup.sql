-- Security/Performance Advisor follow-ups. Same rules as before, expressed so the advisor is satisfied.

-- 1. "Public Can Execute SECURITY DEFINER Function" on trigger functions. Triggers fire them whatever the
--    caller's privileges, so nobody needs to call them through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.sync_self_learner_name() from public, anon, authenticated;
-- is_admin() and owns_learner() stay callable: RLS policies call them as the signed-in (or anonymous) user.
-- verify_certificate() and verify_nawawi_certificate() stay callable: they back the public certificate check.

-- 2. "Multiple Permissive Policies": one policy per table, role and action instead of several that Postgres
--    must each evaluate. Every rule is unchanged.

-- nafahat: everyone reads; admins write.
drop policy if exists "nafahat: admin write" on public.nafahat;
create policy "nafahat: admin insert" on public.nafahat for insert to authenticated with check ((select public.is_admin()));
create policy "nafahat: admin update" on public.nafahat for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "nafahat: admin delete" on public.nafahat for delete to authenticated using ((select public.is_admin()));

-- nafahat_reactions: users read their own, admins read all.
drop policy if exists "nafahat_reactions: read own" on public.nafahat_reactions;
drop policy if exists "nafahat_reactions: admin read" on public.nafahat_reactions;
create policy "nafahat_reactions: read own or admin" on public.nafahat_reactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- sponsors: everyone reads the running ones, admins read and write all.
drop policy if exists "sponsors: read running" on public.sponsors;
drop policy if exists "sponsors: admin read" on public.sponsors;
drop policy if exists "sponsors: admin write" on public.sponsors;
create policy "sponsors: read running or admin" on public.sponsors for select
  using ((active and current_date between starts_on and ends_on) or (select public.is_admin()));
create policy "sponsors: admin insert" on public.sponsors for insert to authenticated with check ((select public.is_admin()));
create policy "sponsors: admin update" on public.sponsors for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "sponsors: admin delete" on public.sponsors for delete to authenticated using ((select public.is_admin()));

-- supporters: users send and read their own request; admins read and manage all.
drop policy if exists "supporters: insert own pending" on public.supporters;
drop policy if exists "supporters: read own" on public.supporters;
drop policy if exists "supporters: admin read" on public.supporters;
drop policy if exists "supporters: admin write" on public.supporters;
create policy "supporters: insert own pending or admin" on public.supporters for insert to authenticated
  with check (
    (
      user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and thanked_at is null and reject_reason is null
      and receipt_path like (select auth.uid())::text || '/%'
    )
    or (select public.is_admin())
  );
create policy "supporters: read own or admin" on public.supporters for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "supporters: admin update" on public.supporters for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "supporters: admin delete" on public.supporters for delete to authenticated using ((select public.is_admin()));
