import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahAyahs, getSurahTafsir } from "@/features/quran/textApi";
import { getKidsSurahs, getTeachingTrack, isKidsSurah } from "@/features/kids/kidsData";
import { KidsLearn } from "@/features/kids/KidsLearn";
import { LevelGate } from "@/features/kids/ui/LevelGate";

export const revalidate = 86400;

function parse(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && isKidsSurah(id) ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/kids/learn/[surah]">): Promise<Metadata> {
  const id = parse((await params).surah);
  if (!id) return {};
  const surah = (await getKidsSurahs()).find((entry) => entry.id === id);
  return { title: surah ? `تعلّم سورة ${surah.name}` : "تعلّم السورة", alternates: { canonical: `/kids/learn/${id}` } };
}

export default async function KidsLearnPage({ params }: PageProps<"/kids/learn/[surah]">) {
  const id = parse((await params).surah);
  if (!id) notFound();
  const [surahs, text, tafsir, teaching] = await Promise.all([
    getKidsSurahs(),
    getSurahAyahs(id),
    getSurahTafsir(id),
    getTeachingTrack(id),
  ]);
  const surah = surahs.find((entry) => entry.id === id) ?? { id, name: String(id), meccan: true };
  return (
    <LevelGate surahId={id}>
      <KidsLearn surah={surah} ayahs={text.ayahs} basmala={text.basmala} tafsir={tafsir} surahs={surahs} teaching={teaching} />
    </LevelGate>
  );
}
