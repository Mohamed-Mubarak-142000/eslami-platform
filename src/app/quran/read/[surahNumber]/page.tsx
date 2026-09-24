import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs, getSurahs, getSurahTafsir, getSurahTajweedAyahs, QuranReadSurah } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

function parseSurahNumber(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

export async function generateMetadata({ params }: { params: Promise<{ surahNumber: string }> }): Promise<Metadata> {
  const { surahNumber } = await params;
  const number = parseSurahNumber(surahNumber);
  if (!number) return { title: "سورة غير موجودة — المنارة" };
  const surahs = await getSurahs();
  const surah = surahs.find((item) => item.id === number);
  return surah
    ? { title: `${surah.name} — قراءة القرآن — المنارة`, description: `نص سورة ${surah.name} كاملًا بالرسم العثماني.` }
    : { title: "سورة غير موجودة — المنارة" };
}

export default async function QuranReadSurahPage({ params }: { params: Promise<{ surahNumber: string }> }) {
  const { surahNumber } = await params;
  const number = parseSurahNumber(surahNumber);
  if (!number) notFound();

  const [surahs, { basmala, ayahs }, tajweedAyahs, tafsirAyahs] = await Promise.all([
    getSurahs(),
    getSurahAyahs(number),
    getSurahTajweedAyahs(number),
    getSurahTafsir(number),
  ]);
  const surah = surahs.find((item) => item.id === number);
  if (!surah || ayahs.length === 0) notFound();

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranReadSurah surah={surah} basmala={basmala} ayahs={ayahs} tajweedAyahs={tajweedAyahs} tafsirAyahs={tafsirAyahs} />
    </div>
  );
}
