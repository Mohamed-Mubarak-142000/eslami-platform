import type { Metadata } from "next";
import { getSurahs, KIDS_SURAH_IDS, QuranKidsMatchHub, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "لعبة التوصيل والتلوين — تعليم الأطفال — المنارة",
  description: "لعبة مطابقة الحروف العربية، ولعبة تلوين أحكام التجويد على آيات حقيقية.",
  alternates: { canonical: "/quran/kids/match" },
};

export default async function QuranKidsMatchPage() {
  const allSurahs = await getSurahs();
  const surahs = KIDS_SURAH_IDS.map((id) => allSurahs.find((surah) => surah.id === id)).filter((surah) => surah !== undefined);

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranKidsMatchHub surahs={surahs} />
    </div>
  );
}
