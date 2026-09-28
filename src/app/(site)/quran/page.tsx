import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSurahs } from "@/features/quran/api";
import { getQuranMeta } from "@/features/quran/textApi";
import { SurahIndex } from "@/features/quran/SurahIndex";
import { mergeSurahMeta } from "@/features/quran/indexSurahs";

export const metadata: Metadata = {
  title: "المصحف الشريف",
  description: "فهرس سور القرآن الكريم مع البحث بالاسم أو الرقم والتصفية حسب الجزء، وقراءة المصحف صفحةً صفحة.",
  alternates: { canonical: "/quran" },
};

export const revalidate = 86400;

export default async function QuranIndexPage() {
  const [surahs, meta] = await Promise.all([getSurahs(), getQuranMeta()]);

  return (
    <>
      <PageHeader
        kicker="المصحف الشريف"
        icon={<BookOpen className="size-4" aria-hidden />}
        title="اقرأ القرآن الكريم"
        description="مصحف مقسّم على صفحات مصحف المدينة، بالرسم العثماني، مع التفسير الميسّر وألوان التجويد."
      />
      <div className="pb-8 pt-16">
        <SurahIndex surahs={mergeSurahMeta(surahs, meta)} />
      </div>
    </>
  );
}
