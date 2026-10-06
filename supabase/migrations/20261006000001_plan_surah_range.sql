-- Memorization plans, part 4: a memorize plan can start and end at a surah inside its juz,
-- not only at the juz edges. Null keeps the juz edge (older plans, and "the whole juz").
-- start_page/end_page are already trimmed to the surahs; these only limit a shared page to its own ayahs.

alter table public.memorization_plans
  add column start_surah smallint check (start_surah between 1 and 114),
  add column end_surah smallint check (end_surah between 1 and 114),
  add constraint memorization_plans_surah_order check (start_surah is null or end_surah is null or start_surah <= end_surah);
