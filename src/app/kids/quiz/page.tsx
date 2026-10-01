import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "اختبر نفسك", alternates: { canonical: "/kids/quiz" } };
export const revalidate = 86400;

export default async function KidsQuizIndexPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/quiz"
      title="اختبر نفسك"
      subtitle="انجح في اختبار السورة لتفتح السورة التالية."
      levels
    />
  );
}
