import { getKidsReciters, getReciters, getSurahs, buildSurahAudioUrl, type Surah } from "@/features/quran/api";
import { getSurahAyahs } from "@/features/quran/textApi";
import { KIDS_SURAH_IDS } from "./kidsSurahs";

export async function getKidsSurahs(): Promise<Surah[]> {
  const surahs = await getSurahs();
  const byId = new Map(surahs.map((surah) => [surah.id, surah]));
  return KIDS_SURAH_IDS.map((id) => byId.get(id)).filter((surah): surah is Surah => surah !== undefined);
}

export function isKidsSurah(id: number): boolean {
  return KIDS_SURAH_IDS.includes(id);
}

export interface TeachingTrack {
  src: string;
  reciterName: string;
}

/** Whole-surah "teaching with children" recitation (mp3quran moshaf type 213), preferring Minshawi. */
export async function getTeachingTrack(surahId: number): Promise<TeachingTrack | null> {
  const teaching = getKidsReciters(await getReciters());
  const ranked = [...teaching].sort((a, b) => Number(b.name.includes("المنشاوي")) - Number(a.name.includes("المنشاوي")));
  for (const reciter of ranked) {
    const moshaf = reciter.moshaf.find((entry) => entry.surahList.includes(surahId));
    if (moshaf) return { src: buildSurahAudioUrl(moshaf.server, surahId), reciterName: reciter.name };
  }
  return null;
}

/** The first ayah of every kids surah, for games that pair a surah with how it begins. */
export async function getKidsFirstAyahs(): Promise<Record<number, string>> {
  const surahs = await getKidsSurahs();
  const texts = await Promise.all(surahs.map((surah) => getSurahAyahs(surah.id)));
  return Object.fromEntries(
    surahs.flatMap((surah, index) => {
      const first = texts[index]?.ayahs[0]?.text;
      return first ? [[surah.id, first] as const] : [];
    }),
  );
}
