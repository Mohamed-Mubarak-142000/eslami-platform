import type { Metadata } from "next";
import { getReciters, getRiwayat, QuranReciters, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "القرآن الكريم — المنارة",
  description: "استمع للقرآن الكريم كاملًا بأصوات نخبة من القراء، سورة سورة.",
  alternates: { canonical: "/quran" },
};

export default async function QuranPage() {
  const [reciters, riwayat] = await Promise.all([getReciters(), getRiwayat()]);
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="listen" />
      <QuranReciters reciters={reciters} riwayat={riwayat} />
    </div>
  );
}
