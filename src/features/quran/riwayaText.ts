import "server-only";
import type { OtherRiwayaKey } from "./riwayat";
import type { Ayah } from "./textApi";

/** [surah, ayah, page, juz, text] in the riwaya's own numbering and mushaf pages. */
type RiwayaRow = [number, number, number, number, string];

interface RiwayaFile {
  basmala: string;
  ayahs: RiwayaRow[];
}

const loaded = new Map<OtherRiwayaKey, Promise<RiwayaFile>>();

function loadRiwaya(key: OtherRiwayaKey): Promise<RiwayaFile> {
  let file = loaded.get(key);
  if (!file) {
    file = import(`@/data/riwayat/${key}.json`).then((module: { default: RiwayaFile }) => module.default);
    loaded.set(key, file);
  }
  return file;
}

/**
 * One surah from the riwaya's own mushaf. Its text already carries the sajda mark where one falls,
 * so `sajda` stays false; there's no hizb data, so `hizbQuarter` is null.
 */
export async function getRiwayaSurah(key: OtherRiwayaKey, surahNumber: number): Promise<{ basmala: string | null; ayahs: Ayah[] }> {
  try {
    const file = await loadRiwaya(key);
    const ayahs = file.ayahs
      .filter(([surah]) => surah === surahNumber)
      .map(([surah, numberInSurah, page, juz, text]) => ({
        number: surah * 1000 + numberInSurah,
        numberInSurah,
        text,
        page,
        juz,
        hizbQuarter: null,
        sajda: false,
      }));
    // Riwayat that don't count the basmala as al-Fatiha's first ayah still print it above the surah.
    const basmalaIsAyah = surahNumber === 1 && ayahs[0]?.text.startsWith(file.basmala);
    return { basmala: surahNumber === 9 || basmalaIsAyah ? null : file.basmala, ayahs };
  } catch {
    loaded.delete(key);
    return { basmala: null, ayahs: [] };
  }
}
