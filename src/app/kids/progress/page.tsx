import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsProgress } from "@/features/kids/progress/KidsProgress";

export const metadata: Metadata = { title: "رحلتي وشاراتي", alternates: { canonical: "/kids/progress" } };
export const revalidate = 86400;

export default async function KidsProgressPage() {
  return <KidsProgress surahs={await getKidsSurahs()} />;
}
