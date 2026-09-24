import type { Metadata } from "next";
import { getSurahs, KIDS_SURAH_IDS, ParentDashboard, ParentGate, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "لوحة الأهل — تعليم الأطفال — المنارة",
  description: "ملخّص لولي الأمر عن تقدّم الطفل في منطقة الأطفال، محفوظ محليًا على هذا الجهاز.",
  alternates: { canonical: "/quran/kids/parent" },
};

export default async function QuranKidsParentPage() {
  const allSurahs = await getSurahs();
  const surahs = KIDS_SURAH_IDS.map((id) => allSurahs.find((surah) => surah.id === id)).filter((surah) => surah !== undefined);

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <ParentGate>
        <ParentDashboard surahs={surahs} />
      </ParentGate>
    </div>
  );
}
