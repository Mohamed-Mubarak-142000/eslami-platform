import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Moon } from "lucide-react";
import { QuranSubnav, RamadanBanner } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";
import "@/features/quran-extras/quran-extras.css";

export const metadata: Metadata = {
  title: "التاريخ الهجري ورمضان — المنارة",
  description: "تابع التاريخ الهجري الحالي والعد التنازلي لرمضان.",
  alternates: { canonical: "/quran/hijri" },
};

export default function QuranHijriPage() {
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="more" />
      <main id="quran-main" className="quran-page quran-extras-page">
        <Link href="/quran/more" className="quran-back">
          <ArrowRight aria-hidden /> المزيد
        </Link>

        <section className="quran-intro">
          <span className="landing-kicker">
            <Moon size={17} aria-hidden /> التقويم الهجري
          </span>
          <h1>التاريخ الهجري ورمضان</h1>
          <p>تابع التاريخ الهجري الحالي، ومتى يبدأ رمضان القادم.</p>
        </section>

        <RamadanBanner />
      </main>
    </div>
  );
}
