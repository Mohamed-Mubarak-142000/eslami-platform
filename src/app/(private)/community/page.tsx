import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Feed } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";

export const metadata: Metadata = {
  title: "مجتمع المنارة",
  description: "مساحة الأعضاء لمتابعة المعرفة الموثقة وأهل الاختصاص.",
  robots: { index: false, follow: false },
};

export default function CommunityPage() {
  if (!isAuthenticatedSession(services.session)) redirect("/login?next=/community");
  return <Feed items={services.data.content} />;
}
