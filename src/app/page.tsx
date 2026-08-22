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
        name: "إذاعة القرآن الكريم من القاهرة — مصر",
        streamUrl: process.env.NEXT_PUBLIC_QURAN_RADIO_URL ?? "https://stream.radiojar.com/8s5u5tpdtwzuv",
        providerName: "إذاعة القرآن الكريم المصرية — الموقع الرسمي",
        providerUrl: "https://misrquran.gov.eg/",
      }}
    />
  );
}
