import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahTajweedAyahs } from "@/features/quran/tajweedApi";
import { getKidsSurahs, isKidsSurah } from "@/features/kids/kidsData";
import { TajweedColorGame } from "@/features/kids/games/TajweedColorGame";

export const metadata: Metadata = { title: "لوّن التجويد" };
export const revalidate = 86400;

export default async function TajweedGamePage({ params }: PageProps<"/kids/games/tajweed/[surah]">) {
  const id = Number((await params).surah);
  if (!Number.isInteger(id) || !isKidsSurah(id)) notFound();
  const [surahs, ayahs] = await Promise.all([getKidsSurahs(), getSurahTajweedAyahs(id)]);
  const surah = surahs.find((entry) => entry.id === id) ?? { id, name: String(id), meccan: true };
  return <TajweedColorGame surah={surah} ayahs={ayahs} />;
}
