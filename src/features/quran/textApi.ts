export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
}

export interface TafsirAyah {
  numberInSurah: number;
  text: string;
}

interface RawAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

const TEXT_BASE_URL = "https://api.alquran.cloud/v1/surah";
const TAFSIR_EDITION = "ar.muyassar";
const TEXT_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;
// Built from verified codepoints (not typed by hand) because Arabic combining marks
// (shadda U+0651 before fatha U+064E) are easy to silently transpose when copy-pasted.
export const BASMALA = String.fromCodePoint(
  0x628, 0x650, 0x633, 0x652, 0x645, 0x650, 0x20, 0x671, 0x644, 0x644, 0x651, 0x64e, 0x647, 0x650, 0x20,
  0x671, 0x644, 0x631, 0x651, 0x64e, 0x62d, 0x652, 0x645, 0x64e, 0x670, 0x646, 0x650, 0x20, 0x671, 0x644,
  0x631, 0x651, 0x64e, 0x62d, 0x650, 0x64a, 0x645, 0x650,
);
const SURAHS_WITHOUT_SEPARATE_BASMALA = new Set([1, 9]);

function stripLeadingBom(text: string): string {
  return text.replace(/^﻿/, "");
}

export async function getSurahAyahs(surahNumber: number): Promise<{ basmala: string | null; ayahs: Ayah[] }> {
  try {
    const response = await fetch(`${TEXT_BASE_URL}/${surahNumber}/quran-uthmani`, { next: { revalidate: TEXT_REVALIDATE_SECONDS } });
    if (!response.ok) return { basmala: null, ayahs: [] };
    const data = (await response.json()) as { data: { ayahs: RawAyah[] } };
    const ayahs = data.data.ayahs.map((ayah) => ({ number: ayah.number, numberInSurah: ayah.numberInSurah, text: stripLeadingBom(ayah.text) }));

    if (!SURAHS_WITHOUT_SEPARATE_BASMALA.has(surahNumber) && ayahs[0]?.text.startsWith(BASMALA)) {
      const [first, ...rest] = ayahs;
      const remainder = first!.text.slice(BASMALA.length).trim();
      return { basmala: BASMALA, ayahs: [{ ...first!, text: remainder }, ...rest] };
    }

    return { basmala: null, ayahs };
  } catch {
    return { basmala: null, ayahs: [] };
  }
}

export async function getSurahTafsir(surahNumber: number): Promise<TafsirAyah[]> {
  try {
    const response = await fetch(`${TEXT_BASE_URL}/${surahNumber}/${TAFSIR_EDITION}`, { next: { revalidate: TEXT_REVALIDATE_SECONDS } });
    if (!response.ok) return [];
    const data = (await response.json()) as { data: { ayahs: RawAyah[] } };
    return data.data.ayahs.map((ayah) => ({ numberInSurah: ayah.numberInSurah, text: stripLeadingBom(ayah.text) }));
  } catch {
    return [];
  }
}
