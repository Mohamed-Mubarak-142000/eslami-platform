import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { QuranSubnav, TopicsAndQA } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";
import "@/features/quran-extras/quran-extras.css";

export const metadata: Metadata = {
  title: "موضوعات وأسئلة شائعة — المنارة",
  description: "مدخل تمهيدي لموضوعات معرفية وأسئلة متداولة.",
  alternates: { canonical: "/quran/topics" },
};

export default function QuranTopicsPage() {
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
            <HelpCircle size={17} aria-hidden /> مواضيع
          </span>
          <h1>موضوعات وأسئلة شائعة</h1>
          <p>مدخل تمهيدي لموضوعات معرفية وأسئلة متداولة.</p>
        </section>

        <TopicsAndQA />
      </main>
    </div>
  );
}
