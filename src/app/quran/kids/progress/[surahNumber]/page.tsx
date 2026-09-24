import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs, getSurahs, SurahMemorizationChecklist } from "@/features";
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
    ? { title: `${surah.name} — رحلتي وشاراتي — المنارة`, description: `تابع حفظك لسورة ${surah.name} آية بآية.` }
    : { title: "سورة غير موجودة — المنارة" };
}

export default async function QuranKidsProgressSurahPage({ params }: { params: Promise<{ surahNumber: string }> }) {
  const { surahNumber } = await params;
  const number = parseSurahNumber(surahNumber);
  if (!number) notFound();

  const [surahs, { ayahs }] = await Promise.all([getSurahs(), getSurahAyahs(number)]);
  const surah = surahs.find((item) => item.id === number);
  if (!surah || ayahs.length === 0) notFound();

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <SurahMemorizationChecklist surah={surah} ayahs={ayahs} />
    </div>
  );
}
