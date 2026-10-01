import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildSurahAudioUrl, getReciters, getSurahs } from "@/features/quran/api";
import { getRiwayaTexts, getSurahAyahs, getSurahTafsir, groupByMushafPage } from "@/features/quran/textApi";
import { findRiwaya, type Riwaya } from "@/features/quran/riwayat";
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

async function loadRiwayaText(riwaya: Riwaya, surah: number) {
  if (!riwaya.edition) return null;
  const [ayahs, fatiha] = await Promise.all([
    getRiwayaTexts(riwaya.edition, surah),
    surah === 1 || surah === 9 ? null : getRiwayaTexts(riwaya.edition, 1),
  ]);
  // The riwaya's basmala is al-Fatiha's first ayah in its own text.
  return ayahs ? { ayahs, basmala: fatiha?.get(1) ?? null } : null;
}

/** A full-surah recitation in the chosen riwaya (per-ayah audio exists only for Hafs). */
async function loadRiwayaAudio(riwaya: Riwaya, surah: number) {
  if (!riwaya.edition) return null;
  const ids: readonly number[] = riwaya.audio;
  for (const reciter of await getReciters()) {
    const moshaf = reciter.moshaf.find((entry) => ids.includes(entry.rewayaId) && entry.surahList.includes(surah));
    if (moshaf) return { reciter: reciter.name, src: buildSurahAudioUrl(moshaf.server, surah) };
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

  const [surahs, text, tafsir, tajweed, riwayaText, riwayaAudio] = await Promise.all([
    getSurahs(),
    getSurahAyahs(number),
    getSurahTafsir(number),
    getSurahTajweedAyahs(number),
    loadRiwayaText(riwaya, number),
    loadRiwayaAudio(riwaya, number),
  ]);
  // Another riwaya keeps the Hafs page layout and swaps each ayah's text; if it can't load, Hafs.
  const ayahs = riwayaText
    ? text.ayahs.map((ayah) => ({ ...ayah, text: riwayaText.ayahs.get(ayah.numberInSurah) ?? ayah.text }))
    : text.ayahs;
  const basmala = riwayaText && text.basmala ? (riwayaText.basmala ?? text.basmala) : text.basmala;
  const surah = surahs.find((entry) => entry.id === number) ?? { id: number, name: String(number), meccan: true };
  const previous = surahs.find((entry) => entry.id === number - 1);
  const next = surahs.find((entry) => entry.id === number + 1);

  return (
    <MushafReader
      surah={surah}
      basmala={basmala}
      pages={groupByMushafPage(ayahs)}
      riwaya={{ key: riwaya.key, label: riwaya.label, short: riwaya.short }}
      riwayaFailed={riwaya.edition !== null && !riwayaText}
      riwayaAudio={riwayaAudio}
      tafsir={tafsir}
      tajweed={tajweed}
      initialMushafPage={Number.isInteger(requestedPage) ? requestedPage : null}
      previousSurah={previous ? { id: previous.id, name: previous.name } : null}
      nextSurah={next ? { id: next.id, name: next.name } : null}
    />
  );
}
