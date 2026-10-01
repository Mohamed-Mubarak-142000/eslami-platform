import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { KidsSurahPicker } from "@/features/kids/ui/KidsSurahPicker";

export const metadata: Metadata = { title: "سمّعني" };
export const revalidate = 86400;

export default async function KidsRecitePickerPage() {
  return (
    <KidsSurahPicker
      surahs={await getKidsSurahs()}
      hrefBase="/kids/recite"
      title="🎤 سمّعني"
      subtitle="اختر سورة واقرأها بصوتك، ورفيقك يسمعك"
    />
  );
}
