import type { Metadata } from "next";
import { getSurahAyahs, getSurahs, KIDS_SURAH_IDS, QuranKidsQuiz, QuranSubnav, type Ayah } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "اختبار تفاعلي — تعليم الأطفال — المنارة",
  description: "أسئلة اختيار من متعدد حول آيات وسور قصيرة، لاختبار حفظ الأطفال بطريقة ممتعة.",
  alternates: { canonical: "/quran/kids/quiz" },
};

export default async function QuranKidsQuizPage() {
  const allSurahs = await getSurahs();
  const surahs = KIDS_SURAH_IDS.map((id) => allSurahs.find((surah) => surah.id === id)).filter((surah) => surah !== undefined);

  const ayahLists = await Promise.all(surahs.map((surah) => getSurahAyahs(surah.id)));
  const ayahsBySurah: Record<number, Ayah[]> = {};
  surahs.forEach((surah, index) => {
    ayahsBySurah[surah.id] = ayahLists[index]?.ayahs ?? [];
  });

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranKidsQuiz surahs={surahs} ayahsBySurah={ayahsBySurah} />
    </div>
  );
}
