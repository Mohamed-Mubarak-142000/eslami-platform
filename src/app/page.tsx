import type { Metadata } from "next";
import { LandingPage } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";

export const metadata: Metadata = {
  title: "المنارة — معرفة إسلامية موثوقة ومجتمع واعٍ",
  description: "منصة عربية للمحتوى الإسلامي الموثق، والمصادر الواضحة، والتواصل مع أهل الاختصاص.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage isAuthenticated={isAuthenticatedSession(services.session)} />;
}
