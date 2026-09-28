import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs } from "@/features/quran/textApi";
import { getKidsSurahs, isKidsSurah } from "@/features/kids/kidsData";
import { SurahChecklist } from "@/features/kids/progress/SurahChecklist";

export const metadata: Metadata = { title: "ما حفظته" };
export const revalidate = 86400;

export default async function SurahProgressPage({ params }: PageProps<"/kids/progress/[surah]">) {
  const id = Number((await params).surah);
  if (!Number.isInteger(id) || !isKidsSurah(id)) notFound();
  const [surahs, text] = await Promise.all([getKidsSurahs(), getSurahAyahs(id)]);
  const surah = surahs.find((entry) => entry.id === id) ?? { id, name: String(id), meccan: true };
  return <SurahChecklist surah={surah} ayahs={text.ayahs} />;
}
