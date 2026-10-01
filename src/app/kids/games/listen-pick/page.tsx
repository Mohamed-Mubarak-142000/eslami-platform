import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "اسمع واختر" };
export const revalidate = 86400;

export default async function ListenPickPickerPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/games/listen-pick"
      title="اسمع واختر"
      subtitle="اختر سورة، واسمع آياتها، وابحث عن الآية التي سمعتها"
      showProgress={false}
    />
  );
}
