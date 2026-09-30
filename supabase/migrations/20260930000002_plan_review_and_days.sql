-- Memorization plans, part 2:
-- * "review" plans for what a learner already knows: no new portion, only a rotating review of
--   the surahs they picked (memorize plans can add such surahs to their older-pages review too);
-- * the weekdays for memorizing and for reviewing, chosen separately.

alter table public.memorization_plans
  add column kind text not null default 'memorize' check (kind in ('memorize', 'review')),
  -- Surahs the learner already knew when making the plan, and the mushaf pages they cover
  -- (outside the plan's own range), which the older-pages review rotates over.
  add column prior_surahs smallint[] not null default '{}',
  add column prior_pages smallint[] not null default '{}',
  -- Weekdays, 0 = Sunday … 6 = Saturday.
  add column new_days smallint[] not null default '{0,1,2,3,4,5,6}',
  add column review_days smallint[] not null default '{0,1,2,3,4,5,6}',
  alter column start_juz drop not null,
  alter column end_juz drop not null,
  alter column start_page drop not null,
  alter column end_page drop not null;

alter table public.memorization_plans
  add constraint memorization_plans_range_by_kind check (
    kind = 'review' or (start_juz is not null and end_juz is not null and start_page is not null and end_page is not null)
  ),
  add constraint memorization_plans_review_has_surahs check (kind = 'memorize' or cardinality(prior_pages) > 0),
  add constraint memorization_plans_days_valid check (
    new_days <@ '{0,1,2,3,4,5,6}'::smallint[] and review_days <@ '{0,1,2,3,4,5,6}'::smallint[]
    and (kind = 'review' or cardinality(new_days) > 0)
    and (kind = 'memorize' or cardinality(review_days) > 0)
  );

-- Review rows store (older-pages cursor, recent anchor); in a review plan the anchor is 0 while the
-- cursor moves on, so the "to >= from" rule no longer holds for them.
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.memorization_plan_log'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%to_unit >= from_unit%';
  if c is not null then execute format('alter table public.memorization_plan_log drop constraint %I', c); end if;
end $$;
alter table public.memorization_plan_log
  add constraint memorization_plan_log_units_valid check (to_unit >= 0 and (kind = 'review' or to_unit >= from_unit));
