import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { PrayerTimesWidget, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";
import "@/features/quran-extras/quran-extras.css";

export const metadata: Metadata = {
  title: "مواقيت الصلاة والقبلة — المنارة",
  description: "مواعيد الصلوات الخمس واتجاه القبلة، محسوبة من موقعك الحالي.",
  alternates: { canonical: "/quran/prayer-times" },
};

export default function QuranPrayerTimesPage() {
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
            <Compass size={17} aria-hidden /> مواقيت الصلاة
          </span>
          <h1>مواقيت الصلاة والقبلة</h1>
          <p>اعرف موعد الصلاة القادمة واتجاه القبلة من موقعك الحالي.</p>
        </section>

        <PrayerTimesWidget />
      </main>
    </div>
  );
}
