import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReciters, getRiwayat, getSurahs, QuranReciterDetail } from "@/features";
import { isAuthenticatedSession, services } from "@/integrations";
import { SiteHeader } from "@/components/layout";
import "@/features/landing/landing.css";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ reciterId: string }> }): Promise<Metadata> {
  const { reciterId } = await params;
  const reciters = await getReciters();
  const reciter = reciters.find((item) => item.id === Number(reciterId));
  return reciter
    ? { title: `${reciter.name} — القرآن الكريم — المنارة`, description: `استمع لتلاوات الشيخ ${reciter.name} لسور القرآن الكريم.` }
    : { title: "قارئ غير موجود — المنارة" };
}

export default async function QuranReciterPage({ params }: { params: Promise<{ reciterId: string }> }) {
  const { reciterId } = await params;
  const [reciters, surahs, riwayat] = await Promise.all([getReciters(), getSurahs(), getRiwayat()]);
  const reciter = reciters.find((item) => item.id === Number(reciterId));
  if (!reciter) notFound();

  return (
    <div className="landing-page">
      <SiteHeader isAuthenticated={isAuthenticatedSession(services.session)} />
      <QuranReciterDetail reciter={reciter} surahs={surahs} riwayat={riwayat} />
    </div>
  );
}
