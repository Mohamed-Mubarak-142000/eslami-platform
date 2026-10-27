import type { RiwayaKey } from "./riwayat";
import type { TajweedSegment } from "./tajweedApi";
import type { Ayah } from "./textApi";

/** Every riwaya the site carries is printed on 604 pages. */
export const TOTAL_PAGES = 604;

export interface MushafAyah extends Ayah {
  surah: number;
  /** Hafs only: the Muyassar tafsir and the tajweed colouring (keyed by Hafs numbering). */
  tafsir: string | null;
  tajweed: TajweedSegment[] | null;
}

/** The ayahs of one surah on a page; a page can hold the end of one surah and the start of the next. */
export interface PageRun {
  surah: number;
  name: string;
  meccan: boolean;
  /** The surah begins on this page, so its banner (and basmala) is drawn above it. */
  opensSurah: boolean;
  basmala: string | null;
  ayahs: MushafAyah[];
}

/** The printed page's font: the 1405 Madinah print (V1), or the tajweed-coloured 1421 print (V4 on V2's layout). */
export type GlyphEdition = "v1" | "tajweed";

/** A word as a glyph of the page's own font; `ayah` is the global ayah number (1…6236). */
export interface GlyphWord {
  code: string;
  ayah: number;
  /** The ayah-end ornament with its number. */
  end: boolean;
}

/** One of the page's printed lines. */
export type MushafLine = { kind: "words"; words: GlyphWord[] } | { kind: "surah"; surah: number; name: string } | { kind: "basmala" };

export interface MushafPageData {
  riwaya: RiwayaKey;
  page: number;
  juz: number;
  /** Null for a riwaya's own mushaf, which carries no hizb data. */
  hizbQuarter: number | null;
  runs: PageRun[];
  /** Hafs only: the page as printed, in each edition; null when it couldn't load (the text still shows). */
  glyphs?: Record<GlyphEdition, MushafLine[] | null> | null;
  /** Another riwaya: a full-surah recitation of the page's first surah in that riwaya, when one exists. */
  recitation: { surah: number; reciter: string; src: string } | null;
}

export interface MushafIndex {
  surahs: { id: number; name: string; meccan: boolean; startPage: number }[];
  /** First page of each juz (index 0 = juz 1). */
  juzStartPages: number[];
  /** Hafs only: the global number (1…6236) of each page's first ayah, to follow the recitation across pages. */
  pageFirstAyah: number[] | null;
}
