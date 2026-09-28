import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "رتّب الآية", alternates: { canonical: "/kids/games/arrange" } };
export const revalidate = 86400;

export default async function ArrangePickerPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/games/arrange"
      title="رتّب الآية"
      subtitle="اختر سورة ورتّب كلمات آياتها"
      showProgress={false}
    />
  );
}
