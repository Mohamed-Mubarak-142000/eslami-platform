import type { Surah } from "./api";
import type { SurahMeta } from "./textApi";

export interface IndexSurah extends Surah {
  ayahCount: number;
  juzStart: number;
}

export function mergeSurahMeta(surahs: Surah[], meta: SurahMeta[]): IndexSurah[] {
  const byNumber = new Map(meta.map((entry) => [entry.number, entry]));
  return surahs.map((surah) => ({
    ...surah,
    ayahCount: byNumber.get(surah.id)?.ayahCount ?? 0,
    juzStart: byNumber.get(surah.id)?.juzStart ?? 0,
  }));
}
