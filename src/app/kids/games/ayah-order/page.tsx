import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "رتّب الآيات" };
export const revalidate = 86400;

export default async function AyahOrderPickerPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/games/ayah-order"
      title="رتّب الآيات"
      subtitle="اختر سورة، ورتّب آياتها كما في المصحف"
      showProgress={false}
    />
  );
}
