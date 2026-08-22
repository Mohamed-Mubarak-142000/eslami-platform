import type { Metadata } from "next";
import { LandingPage } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";

export const metadata: Metadata = {
  title: "بصيرة — معرفة إسلامية موثوقة ومجتمع واعٍ",
  description: "منصة عربية للمحتوى الإسلامي الموثق، والمصادر الواضحة، والتواصل مع أهل الاختصاص.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <LandingPage
      isAuthenticated={isAuthenticatedSession(services.session)}
      station={{
        name: "الإذاعة العامة — تلاوات متنوعة",
        streamUrl: process.env.NEXT_PUBLIC_QURAN_RADIO_URL ?? "https://backup.qurango.net/radio/mix",
        providerName: "MP3Quran.net",
        providerUrl: "https://www.mp3quran.net/ar/radios",
      }}
    />
  );
}
