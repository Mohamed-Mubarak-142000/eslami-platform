import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs } from "@/features/quran/textApi";
import { getKidsSurahs, isKidsSurah } from "@/features/kids/kidsData";
import { KidsQuiz } from "@/features/kids/quiz/KidsQuiz";
import { LevelGate } from "@/features/kids/ui/LevelGate";

export const revalidate = 86400;

function parse(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && isKidsSurah(id) ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/kids/quiz/[surah]">): Promise<Metadata> {
  const id = parse((await params).surah);
  if (!id) return {};
  const surah = (await getKidsSurahs()).find((entry) => entry.id === id);
  return { title: surah ? `اختبار سورة ${surah.name}` : "اختبار السورة", alternates: { canonical: `/kids/quiz/${id}` } };
}

export default async function KidsSurahQuizPage({ params }: PageProps<"/kids/quiz/[surah]">) {
  const id = parse((await params).surah);
  if (!id) notFound();
  // Every kids surah is loaded because the wrong choices come from the other surahs.
  const surahs = await getKidsSurahs();
  const texts = await Promise.all(surahs.map((surah) => getSurahAyahs(surah.id)));
  const ayahsBySurah = Object.fromEntries(surahs.map((surah, index) => [surah.id, texts[index]?.ayahs ?? []]));
  return (
    <LevelGate surahId={id}>
      <KidsQuiz surahs={surahs} ayahsBySurah={ayahsBySurah} surahId={id} />
    </LevelGate>
  );
}
