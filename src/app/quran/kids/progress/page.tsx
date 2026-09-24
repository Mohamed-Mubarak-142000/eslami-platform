import type { Metadata } from "next";
import { getSurahs, KIDS_SURAH_IDS, QuranKidsProgressOverview, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "رحلتي وشاراتي — تعليم الأطفال — المنارة",
  description: "تابع الآيات التي حفظها الطفل واجمع شارات الإنجاز.",
  alternates: { canonical: "/quran/kids/progress" },
};

export default async function QuranKidsProgressPage() {
  const allSurahs = await getSurahs();
  const surahs = KIDS_SURAH_IDS.map((id) => allSurahs.find((surah) => surah.id === id)).filter((surah) => surah !== undefined);

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranKidsProgressOverview surahs={surahs} />
    </div>
  );
}
