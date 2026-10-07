-- Khatma, part 2: a khatma can cover part of the mushaf (a run of surahs or of juz), not only all of
-- it. Positions are ayahs counted from 0 like `position`; end_ayah is exclusive. The defaults keep
-- every existing khatma as a whole-Quran one.

alter table public.khatmas
  add column start_ayah smallint not null default 0 check (start_ayah between 0 and 6235),
  add column end_ayah smallint not null default 6236 check (end_ayah between 1 and 6236),
  add constraint khatmas_range_order check (start_ayah < end_ayah);
