import type { Metadata } from "next";
import { LetterMatchGame, QuranSubnav } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const metadata: Metadata = {
  title: "لعبة مطابقة الحروف — تعليم الأطفال — المنارة",
  description: "طابق كل حرف عربي باسمه في لعبة ذاكرة ممتعة للأطفال.",
  alternates: { canonical: "/quran/kids/match/letters" },
};

export default function QuranKidsMatchLettersPage() {
  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranSubnav active="kids" />
      <LetterMatchGame />
    </div>
  );
}
