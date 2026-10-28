import "server-only";
import { toIndex } from "@/features/khatma/schedule";
import { getSurahs } from "./api";
import type { MushafAyah, MushafIndex, MushafPageData, PageRun } from "./mushafPageTypes";
import { TOTAL_PAGES } from "./mushafPageTypes";
import { getSurahTajweedAyahs } from "./tajweedApi";
import { getGlyphLines } from "./glyphApi";
import { getJuzStarts, getMushafPageStarts, getSurahAyahs, getSurahTafsir, type AyahRef } from "./textApi";

type SurahInfo = { id: number; name: string; meccan: boolean };

async function surahInfo(): Promise<Map<number, SurahInfo>> {
  return new Map((await getSurahs()).map((surah) => [surah.id, surah]));
}

function info(surahs: Map<number, SurahInfo>, id: number): SurahInfo {
  return surahs.get(id) ?? { id, name: String(id), meccan: true };
}

/** The page holding an ayah: the last page that starts at or before it. */
function pageOfRef(pageStarts: number[], ref: AyahRef): number {
  const target = toIndex(ref);
  let page = 1;
  for (let index = 0; index < pageStarts.length; index++) if (pageStarts[index]! <= target) page = index + 1;
  return page;
}

async function hafsPage(page: number): Promise<MushafPageData | null> {
  const [starts, surahs] = await Promise.all([getMushafPageStarts(), surahInfo()]);
  const first = starts[page - 1];
  if (!first) return null;
  const last = starts[page]?.surah ?? 114;
  const ids = Array.from({ length: last - first.surah + 1 }, (_, index) => first.surah + index);

  const runs = await Promise.all(
    ids.map(async (id): Promise<PageRun | null> => {
      const [text, tafsir, tajweed] = await Promise.all([getSurahAyahs(id), getSurahTafsir(id), getSurahTajweedAyahs(id)]);
      const tafsirByAyah = new Map(tafsir.map((entry) => [entry.numberInSurah, entry.text]));
      const tajweedByAyah = new Map(tajweed.map((entry) => [entry.numberInSurah, entry.segments]));
      const ayahs: MushafAyah[] = text.ayahs
        .filter((ayah) => ayah.page === page)
        .map((ayah) => ({
          ...ayah,
          surah: id,
          tafsir: tafsirByAyah.get(ayah.numberInSurah) ?? null,
          tajweed: tajweedByAyah.get(ayah.numberInSurah) ?? null,
        }));
      if (ayahs.length === 0) return null;
      const opensSurah = ayahs[0]!.numberInSurah === 1;
      return { ...info(surahs, id), surah: id, opensSurah, basmala: opensSurah ? text.basmala : null, ayahs };
    }),
  );
  const present = runs.filter((run): run is PageRun => run !== null);
  const lead = present[0]?.ayahs[0];
  if (!lead) return null;
  // The printed page is a bonus over the text: if quran.com can't be reached, the page still shows.
  const tajweed = await getGlyphLines(page, (id) => info(surahs, id).name).catch(() => null);
  return { page, juz: lead.juz, hizbQuarter: lead.hizbQuarter, runs: present, glyphs: { tajweed } };
}

/** One page of the mushaf, with every surah on it; null when it can't load. */
export async function getMushafPage(page: number): Promise<MushafPageData | null> {
  if (!Number.isInteger(page) || page < 1 || page > TOTAL_PAGES) return null;
  try {
    return await hafsPage(page);
  } catch {
    return null;
  }
}

/** Where each surah and juz begins in the mushaf, for the jump sheet. */
export async function getMushafIndex(): Promise<MushafIndex | null> {
  const [surahs, pageStarts, juzStarts] = await Promise.all([surahInfo(), getMushafPageStarts(), getJuzStarts()]);
  if (pageStarts.length !== TOTAL_PAGES || juzStarts.length !== 30) return null;
  const starts = pageStarts.map(toIndex);
  return {
    surahs: Array.from({ length: 114 }, (_, index) => ({
      ...info(surahs, index + 1),
      startPage: pageOfRef(starts, { surah: index + 1, ayah: 1 }),
    })),
    juzStartPages: juzStarts.map((ref) => pageOfRef(starts, ref)),
    pageFirstAyah: starts.map((index) => index + 1),
  };
}
