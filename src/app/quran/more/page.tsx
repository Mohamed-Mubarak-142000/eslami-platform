import type { Metadata } from "next";
import { QuranExtrasHub, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";
import "@/features/quran-extras/quran-extras.css";

export const metadata: Metadata = {
  title: "المزيد — القرآن الكريم — المنارة",
  description: "مواقيت الصلاة واتجاه القبلة، التقويم الهجري، أدعية مأثورة، وموضوعات وأسئلة شائعة.",
  alternates: { canonical: "/quran/more" },
};

export default function QuranMorePage() {
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="more" />
      <QuranExtrasHub />
    </div>
  );
}
