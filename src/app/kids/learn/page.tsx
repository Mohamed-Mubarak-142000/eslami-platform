import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "تعلّم السور", alternates: { canonical: "/kids/learn" } };
export const revalidate = 86400;

export default async function KidsLearnIndexPage() {
  const surahs = await getKidsSurahs();
  return (
    <KidsSurahPicker
      surahs={surahs}
      hrefBase="/kids/learn"
      title="اختر سورة لتتعلّمها"
      subtitle="استمع لكل آية مع الشيخ وردّدها، ثم انجح في اختبار السورة لتفتح التالية."
      levels
    />
  );
}
