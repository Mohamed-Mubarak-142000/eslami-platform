import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahs } from "@/features/quran/api";
import { getSurahAyahs, getSurahTafsir, groupByMushafPage } from "@/features/quran/textApi";
import { getSurahTajweedAyahs } from "@/features/quran/tajweedApi";
import { MushafReader } from "@/features/quran/MushafReader";

export const revalidate = 86400;

function parseSurah(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

export async function generateMetadata({ params }: PageProps<"/quran/[surah]">): Promise<Metadata> {
  const number = parseSurah((await params).surah);
  if (!number) return {};
  const surahs = await getSurahs();
  const name = surahs.find((surah) => surah.id === number)?.name ?? String(number);
  return {
    title: `سورة ${name}`,
    description: `اقرأ سورة ${name} في مصحف مصفّح بالرسم العثماني مع التفسير الميسّر وألوان التجويد.`,
    alternates: { canonical: `/quran/${number}` },
  };
}

export default async function SurahPage({ params, searchParams }: PageProps<"/quran/[surah]">) {
  const number = parseSurah((await params).surah);
  if (!number) notFound();
  const pageParam = (await searchParams).page;
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam);

  const [surahs, text, tafsir, tajweed] = await Promise.all([
    getSurahs(),
    getSurahAyahs(number),
    getSurahTafsir(number),
    getSurahTajweedAyahs(number),
  ]);
  const surah = surahs.find((entry) => entry.id === number) ?? { id: number, name: String(number), meccan: true };
  const previous = surahs.find((entry) => entry.id === number - 1);
  const next = surahs.find((entry) => entry.id === number + 1);

  return (
    <MushafReader
      surah={surah}
      basmala={text.basmala}
      pages={groupByMushafPage(text.ayahs)}
      tafsir={tafsir}
      tajweed={tajweed}
      initialMushafPage={Number.isInteger(requestedPage) ? requestedPage : null}
      previousSurah={previous ? { id: previous.id, name: previous.name } : null}
      nextSurah={next ? { id: next.id, name: next.name } : null}
    />
  );
}
