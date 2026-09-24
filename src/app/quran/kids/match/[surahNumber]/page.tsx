import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahs, getSurahTajweedAyahs, TajweedMatchGame } from "@/features";
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
    ? { title: `لعبة تلوين التجويد — ${surah.name} — المنارة`, description: `طابق ألوان أحكام التجويد في سورة ${surah.name}.` }
    : { title: "سورة غير موجودة — المنارة" };
}

export default async function QuranKidsMatchSurahPage({ params }: { params: Promise<{ surahNumber: string }> }) {
  const { surahNumber } = await params;
  const number = parseSurahNumber(surahNumber);
  if (!number) notFound();

  const [surahs, tajweedAyahs] = await Promise.all([getSurahs(), getSurahTajweedAyahs(number)]);
  const surah = surahs.find((item) => item.id === number);
  if (!surah || tajweedAyahs.length === 0) notFound();

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <TajweedMatchGame surah={surah} tajweedAyahs={tajweedAyahs} />
    </div>
  );
}
