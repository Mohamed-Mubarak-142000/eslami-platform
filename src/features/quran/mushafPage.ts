import "server-only";
import { toIndex } from "@/features/khatma/schedule";
import { buildSurahAudioUrl, getReciters, getSurahs } from "./api";
import type { MushafAyah, MushafIndex, MushafPageData, PageRun } from "./mushafPageTypes";
import { TOTAL_PAGES } from "./mushafPageTypes";
import { loadRiwaya } from "./riwayaText";
import { findRiwaya, type OtherRiwayaKey, type RiwayaKey } from "./riwayat";
import { getSurahTajweedAyahs } from "./tajweedApi";
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

/** A full-surah recitation in the chosen riwaya (per-ayah audio exists only for Hafs). */
async function riwayaRecitation(key: OtherRiwayaKey, surah: number) {
  const ids: readonly number[] = findRiwaya(key).audio;
  for (const reciter of await getReciters()) {
    const moshaf = reciter.moshaf.find((entry) => ids.includes(entry.rewayaId) && entry.surahList.includes(surah));
    if (moshaf) return { surah, reciter: reciter.name, src: buildSurahAudioUrl(moshaf, surah) };
  }
  return null;
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
  return { riwaya: "hafs", page, juz: lead.juz, hizbQuarter: lead.hizbQuarter, runs: present, recitation: null };
}

async function riwayaPage(key: OtherRiwayaKey, page: number): Promise<MushafPageData | null> {
  const [file, surahs] = await Promise.all([loadRiwaya(key), surahInfo()]);
  const rows = file.ayahs.filter((row) => row[2] === page);
  if (rows.length === 0) return null;
  const runs: PageRun[] = [];
  for (const [surah, numberInSurah, , juz, text] of rows) {
    let run = runs.at(-1);
    if (!run || run.surah !== surah) {
      const opensSurah = numberInSurah === 1;
      // Riwayat that don't count the basmala as al-Fatiha's first ayah still print it above the surah.
      const basmalaIsAyah = surah === 1 && text.startsWith(file.basmala);
      run = {
        ...info(surahs, surah),
        surah,
        opensSurah,
        basmala: opensSurah && surah !== 9 && !basmalaIsAyah ? file.basmala : null,
        ayahs: [],
      };
      runs.push(run);
    }
    run.ayahs.push({
      number: surah * 1000 + numberInSurah,
      numberInSurah,
      text,
      page,
      juz,
      hizbQuarter: null,
      sajda: false,
      surah,
      tafsir: null,
      tajweed: null,
    });
  }
  const recitation = await riwayaRecitation(key, runs[0]!.surah);
  return { riwaya: key, page, juz: rows[0]![3], hizbQuarter: null, runs, recitation };
}

/** One page of the chosen riwaya's mushaf, with every surah on it; null when it can't load. */
export async function getMushafPage(riwaya: RiwayaKey, page: number): Promise<MushafPageData | null> {
  if (!Number.isInteger(page) || page < 1 || page > TOTAL_PAGES) return null;
  try {
    return riwaya === "hafs" ? await hafsPage(page) : await riwayaPage(riwaya, page);
  } catch {
    return null;
  }
}

/** Where each surah and juz begins in the chosen riwaya's mushaf, for the jump sheet. */
export async function getMushafIndex(riwaya: RiwayaKey): Promise<MushafIndex | null> {
  const surahs = await surahInfo();
  const list = (startPage: (id: number) => number) =>
    Array.from({ length: 114 }, (_, index) => ({ ...info(surahs, index + 1), startPage: startPage(index + 1) }));

  if (riwaya === "hafs") {
    const [pageStarts, juzStarts] = await Promise.all([getMushafPageStarts(), getJuzStarts()]);
    if (pageStarts.length !== TOTAL_PAGES || juzStarts.length !== 30) return null;
    const starts = pageStarts.map(toIndex);
    return {
      surahs: list((id) => pageOfRef(starts, { surah: id, ayah: 1 })),
      juzStartPages: juzStarts.map((ref) => pageOfRef(starts, ref)),
      pageFirstAyah: starts.map((index) => index + 1),
    };
  }
  try {
    const file = await loadRiwaya(riwaya);
    const surahStart = new Map<number, number>();
    const juzStart = new Map<number, number>();
    for (const [surah, , page, juz] of file.ayahs) {
      if (!surahStart.has(surah)) surahStart.set(surah, page);
      if (!juzStart.has(juz)) juzStart.set(juz, page);
    }
    return {
      surahs: list((id) => surahStart.get(id) ?? 1),
      juzStartPages: Array.from({ length: 30 }, (_, index) => juzStart.get(index + 1) ?? 1),
      pageFirstAyah: null,
    };
  } catch {
    return null;
  }
}
