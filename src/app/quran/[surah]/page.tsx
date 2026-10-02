import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildSurahAudioUrl, getReciters, getSurahs } from "@/features/quran/api";
import { getSurahAyahs, getSurahTafsir, groupByMushafPage } from "@/features/quran/textApi";
import { getRiwayaSurah } from "@/features/quran/riwayaText";
import { DEFAULT_RIWAYA, findRiwaya, type Riwaya } from "@/features/quran/riwayat";
import { getSurahTajweedAyahs } from "@/features/quran/tajweedApi";
import { MushafReader } from "@/features/quran/MushafReader";
import { riwayaFontFamily } from "@/features/quran/riwayaFonts";

export const revalidate = 86400;

const HAFS = { key: DEFAULT_RIWAYA.key, label: DEFAULT_RIWAYA.label, short: DEFAULT_RIWAYA.short };

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

/** The surah from the chosen riwaya's own mushaf; null for Hafs or when it can't load. */
async function loadRiwayaText(riwaya: Riwaya, surah: number) {
  if (riwaya.key === "hafs") return null;
  const text = await getRiwayaSurah(riwaya.key, surah);
  return text.ayahs.length > 0 ? text : null;
}

/** A full-surah recitation in the chosen riwaya (per-ayah audio exists only for Hafs). */
async function loadRiwayaAudio(riwaya: Riwaya, surah: number) {
  if (riwaya.key === "hafs") return null;
  const ids: readonly number[] = riwaya.audio;
  for (const reciter of await getReciters()) {
    const moshaf = reciter.moshaf.find((entry) => ids.includes(entry.rewayaId) && entry.surahList.includes(surah));
    if (moshaf) return { reciter: reciter.name, src: buildSurahAudioUrl(moshaf, surah) };
  }
  return null;
}

export default async function SurahPage({ params, searchParams }: PageProps<"/quran/[surah]">) {
  const number = parseSurah((await params).surah);
  if (!number) notFound();
  const query = await searchParams;
  const pageParam = query.page;
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam);
  const riwaya = findRiwaya(Array.isArray(query.riwaya) ? query.riwaya[0] : query.riwaya);

  const [surahs, riwayaText, riwayaAudio] = await Promise.all([
    getSurahs(),
    loadRiwayaText(riwaya, number),
    loadRiwayaAudio(riwaya, number),
  ]);
  // Another riwaya is read from its own mushaf, whose ayah numbering can differ from Hafs, so the
  // Hafs tafsir and tajweed colours (keyed by Hafs ayah number) are only loaded for Hafs.
  // If the riwaya can't load, Hafs is shown instead.
  const [text, tafsir, tajweed] = riwayaText
    ? [riwayaText, [], []]
    : await Promise.all([getSurahAyahs(number), getSurahTafsir(number), getSurahTajweedAyahs(number)]);
  const surah = surahs.find((entry) => entry.id === number) ?? { id: number, name: String(number), meccan: true };
  const previous = surahs.find((entry) => entry.id === number - 1);
  const next = surahs.find((entry) => entry.id === number + 1);

  return (
    <MushafReader
      surah={surah}
      basmala={text.basmala}
      pages={groupByMushafPage(text.ayahs)}
      riwaya={riwayaText ? { key: riwaya.key, label: riwaya.label, short: riwaya.short } : HAFS}
      riwayaFailed={riwaya.key !== "hafs" && !riwayaText}
      failedRiwayaLabel={riwaya.label}
      riwayaFont={riwayaText && riwaya.key !== "hafs" ? riwayaFontFamily(riwaya.key) : null}
      riwayaAudio={riwayaAudio}
      tafsir={tafsir}
      tajweed={tajweed}
      initialMushafPage={Number.isInteger(requestedPage) ? requestedPage : null}
      previousSurah={previous ? { id: previous.id, name: previous.name } : null}
      nextSurah={next ? { id: next.id, name: next.name } : null}
    />
  );
}
