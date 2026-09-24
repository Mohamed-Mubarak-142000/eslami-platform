import type { Metadata } from "next";
import { getSurahs, QuranReadIndex, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "قراءة القرآن الكريم — المنارة",
  description: "تصفّح المصحف الشريف سورة سورة، بالرسم العثماني وأرقام الآيات.",
  alternates: { canonical: "/quran/read" },
};

export default async function QuranReadPage() {
  const surahs = await getSurahs();
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="read" />
      <QuranReadIndex surahs={surahs} />
    </div>
  );
}
