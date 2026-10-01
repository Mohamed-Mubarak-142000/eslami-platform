import type { Metadata } from "next";
import { getKidsFirstAyahs, getKidsSurahs } from "@/features/kids/kidsData";
import { TrueFalseGame } from "@/features/kids/games/TrueFalseGame";

export const metadata: Metadata = { title: "صح أم خطأ" };
export const revalidate = 86400;

export default async function TrueFalsePage() {
  const [surahs, firstAyahs] = await Promise.all([getKidsSurahs(), getKidsFirstAyahs()]);
  return <TrueFalseGame surahs={surahs} firstAyahs={firstAyahs} />;
}
