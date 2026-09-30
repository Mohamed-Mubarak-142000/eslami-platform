-- Memorization plans, part 3: a learner can say they know whole juz, not only whole surahs.
-- A juz doesn't always align with surahs (juz 2 lies inside al-Baqarah), so it's kept as a juz;
-- its pages go into prior_pages like the surahs' do.

alter table public.memorization_plans
  add column prior_juz smallint[] not null default '{}' check (prior_juz <@ '{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30}'::smallint[]);
