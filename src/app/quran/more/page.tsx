import type { Metadata } from "next";
import { DuasList, PrayerTimesWidget, QuranSubnav, RamadanBanner, TopicsAndQA } from "@/features";
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
      <main id="quran-main" className="quran-page quran-extras-page">
        <section className="quran-intro">
          <span className="landing-kicker">المزيد</span>
          <h1>مواقيت، تقويم، وأدعية</h1>
          <p>إضافات خفيفة تكمّل تجربة القرآن الكريم في الموقع.</p>
        </section>

        <RamadanBanner />
        <PrayerTimesWidget />
        <DuasList />
        <TopicsAndQA />
      </main>
    </div>
  );
}
