import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getKidsSurahs, getTeachingTrack, isKidsSurah } from "@/features/kids/kidsData";
import { SurahMission } from "@/features/kids/journey/SurahMission";

export const revalidate = 86400;

function parse(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && isKidsSurah(id) ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/kids/journey/[surah]">): Promise<Metadata> {
  const id = parse((await params).surah);
  if (!id) return {};
  const surah = (await getKidsSurahs()).find((entry) => entry.id === id);
  return { title: surah ? `محطة سورة ${surah.name}` : "محطة الرحلة" };
}

export default async function JourneyStationPage({ params }: PageProps<"/kids/journey/[surah]">) {
  const id = parse((await params).surah);
  if (!id) notFound();
  const [surahs, teaching] = await Promise.all([getKidsSurahs(), getTeachingTrack(id)]);
  const surah = surahs.find((entry) => entry.id === id) ?? { id, name: String(id), meccan: true };
  return <SurahMission surah={surah} teaching={teaching} />;
}
