import type { Metadata } from "next";
import { Headphones } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getReciters, getRiwayat } from "@/features/quran/api";
import { ReciterBrowser } from "@/features/listen/ReciterBrowser";

export const metadata: Metadata = {
  title: "الاستماع للقرآن الكريم",
  description: "استمع للقرآن الكريم كاملًا بأصوات أكثر من مئتي قارئ وبمختلف الروايات.",
  alternates: { canonical: "/listen" },
};

export const revalidate = 86400;

export default async function ListenPage() {
  const [reciters, riwayat] = await Promise.all([getReciters(), getRiwayat()]);
  return (
    <>
      <PageHeader
        kicker="المكتبة الصوتية"
        icon={<Headphones className="size-4" aria-hidden />}
        title="القرآن الكريم بأصوات نخبة القرّاء"
        description="اختر قارئك المفضّل واستمع لأي سورة، والتلاوة تستمر معك وأنت تتنقّل في الموقع."
      />
      <div className="pt-10">
        <ReciterBrowser reciters={reciters} riwayat={riwayat} />
      </div>
    </>
  );
}
