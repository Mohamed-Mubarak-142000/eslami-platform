import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DuasList, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";
import "@/features/quran-extras/quran-extras.css";

export const metadata: Metadata = {
  title: "أدعية مأثورة — المنارة",
  description: "أدعية قصيرة موثوقة لمناسبات يومك، مصنّفة مع عدّاد للتكرار.",
  alternates: { canonical: "/quran/duas" },
};

export default function QuranDuasPage() {
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
            <Sparkles size={17} aria-hidden /> أدعية
          </span>
          <h1>أدعية مأثورة</h1>
          <p>أدعية قصيرة لمناسبات يومك، مصنّفة حسب الوقت مع عدّاد للتكرار.</p>
        </section>

        <DuasList />
      </main>
    </div>
  );
}
