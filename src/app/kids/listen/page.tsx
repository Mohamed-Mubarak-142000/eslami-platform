import type { Metadata } from "next";
import { getKidsReciters, getReciters } from "@/features/quran/api";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsListen } from "@/features/kids/KidsListen";

export const metadata: Metadata = { title: "استمع مع الأطفال", alternates: { canonical: "/kids/listen" } };
export const revalidate = 86400;

export default async function KidsListenPage() {
  const [reciters, surahs] = await Promise.all([getReciters(), getKidsSurahs()]);
  const teaching = getKidsReciters(reciters).sort((a, b) => Number(b.name.includes("المنشاوي")) - Number(a.name.includes("المنشاوي")));
  return <KidsListen reciters={teaching} surahs={surahs} />;
}
