import type { Metadata } from "next";
import { getKidsReciters, getReciters, getRiwayat, QuranReciters, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "استمع للمصحف المعلم — تعليم الأطفال — المنارة",
  description: "تسجيلات المصحف المعلم التي تُكرَّر فيها كل آية مرتين، لتحفيظ الأطفال ومبتدئي الحفظ.",
  alternates: { canonical: "/quran/kids/audio" },
};

export default async function QuranKidsAudioPage() {
  const [allReciters, riwayat] = await Promise.all([getReciters(), getRiwayat()]);
  const reciters = getKidsReciters(allReciters);

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranReciters
        reciters={reciters}
        riwayat={riwayat}
        linkBase="/quran/kids/audio"
        kicker="المصحف المعلم"
        title="استمع للمصحف المعلم"
        description="تسجيلات يُكرَّر فيها كل آية مرتين، بأسلوب مخصص لتحفيظ الأطفال ومبتدئي الحفظ."
      />
    </div>
  );
}
