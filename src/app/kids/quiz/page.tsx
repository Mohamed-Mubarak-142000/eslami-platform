import type { Metadata } from "next";
import { getSurahAyahs } from "@/features/quran/textApi";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsQuiz } from "@/features/kids/quiz/KidsQuiz";

export const metadata: Metadata = { title: "اختبر نفسك", alternates: { canonical: "/kids/quiz" } };
export const revalidate = 86400;

export default async function KidsQuizPage() {
  const surahs = await getKidsSurahs();
  const texts = await Promise.all(surahs.map((surah) => getSurahAyahs(surah.id)));
  const ayahsBySurah = Object.fromEntries(surahs.map((surah, index) => [surah.id, texts[index]?.ayahs ?? []]));
  return <KidsQuiz surahs={surahs} ayahsBySurah={ayahsBySurah} />;
}
