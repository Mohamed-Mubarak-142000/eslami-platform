import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "لوّن التجويد", alternates: { canonical: "/kids/games/tajweed" } };
export const revalidate = 86400;

export default async function TajweedPickerPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/games/tajweed"
      title="لوّن التجويد"
      subtitle="اختر سورة لتكتشف أحكام التجويد فيها"
      showProgress={false}
    />
  );
}
