import type { Metadata } from "next";
import { getSurahs, KIDS_SURAH_IDS, QuranKidsListenPicker, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "استمع وردد — تعليم الأطفال — المنارة",
  description: "استمع لكل آية بمفردها مع تظليلها، ثم رددها بصوتك.",
  alternates: { canonical: "/quran/kids/listen" },
};

export default async function QuranKidsListenPage() {
  const allSurahs = await getSurahs();
  const surahs = KIDS_SURAH_IDS.map((id) => allSurahs.find((surah) => surah.id === id)).filter((surah) => surah !== undefined);

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranKidsListenPicker surahs={surahs} />
    </div>
  );
}
