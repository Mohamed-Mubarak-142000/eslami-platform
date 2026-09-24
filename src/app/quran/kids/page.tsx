import type { Metadata } from "next";
import { QuranKidsHub, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const metadata: Metadata = {
  title: "منطقة الأطفال — تعلّم القرآن الكريم — المنارة",
  description: "استماع وترديد، ألعاب تفاعلية، اختبارات، ومتابعة الحفظ — طرق ممتعة لتعليم الأطفال القرآن الكريم.",
  alternates: { canonical: "/quran/kids" },
};

export default function QuranKidsPage() {
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <QuranKidsHub />
    </div>
  );
}
