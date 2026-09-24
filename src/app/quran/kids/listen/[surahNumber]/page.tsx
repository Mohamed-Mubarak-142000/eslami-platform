import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs, getSurahs, QuranKidsListen } from "@/features";
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
    ? { title: `استمع وردد ${surah.name} — المنارة`, description: `استمع لآيات سورة ${surah.name} آية بآية وردّدها.` }
    : { title: "سورة غير موجودة — المنارة" };
}

export default async function QuranKidsListenSurahPage({ params }: { params: Promise<{ surahNumber: string }> }) {
  const { surahNumber } = await params;
  const number = parseSurahNumber(surahNumber);
  if (!number) notFound();

  const [surahs, { ayahs }] = await Promise.all([getSurahs(), getSurahAyahs(number)]);
  const surah = surahs.find((item) => item.id === number);
  if (!surah || ayahs.length === 0) notFound();

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranKidsListen surah={surah} ayahs={ayahs} />
    </div>
  );
}
