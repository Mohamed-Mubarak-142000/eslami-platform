import type { Metadata } from "next";
import { getKidsFirstAyahs, getKidsSurahs, isKidsSurah } from "@/features/kids/kidsData";
import { SurahMatchGame } from "@/features/kids/games/SurahMatchGame";

export const metadata: Metadata = { title: "ذاكرة السور" };

export default async function SurahMatchPage({ searchParams }: PageProps<"/kids/games/surah-match">) {
  const surahParam = Number((await searchParams).surah);
  const focus = Number.isInteger(surahParam) && isKidsSurah(surahParam) ? surahParam : null;
  const [surahs, firstAyahs] = await Promise.all([getKidsSurahs(), getKidsFirstAyahs()]);
  return <SurahMatchGame key={focus ?? "all"} surahs={surahs} firstAyahs={firstAyahs} focusSurahId={focus} />;
}
