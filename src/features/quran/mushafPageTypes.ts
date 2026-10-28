import type { TajweedSegment } from "./tajweedApi";
import type { Ayah } from "./textApi";

/** The Madinah mushaf is printed on 604 pages. */
export const TOTAL_PAGES = 604;

export interface MushafAyah extends Ayah {
  surah: number;
  /** The Muyassar tafsir and the tajweed colouring. */
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
  page: number;
  juz: number;
  hizbQuarter: number;
  runs: PageRun[];
  /**
   * The page as printed in the tajweed-coloured 1421 print (V4 on V2's layout); null when it couldn't
   * load (the text still shows). Kept under `tajweed` so pages cached in the earlier shape still read.
   */
  glyphs?: { tajweed: MushafLine[] | null } | null;
}

export interface MushafIndex {
  surahs: { id: number; name: string; meccan: boolean; startPage: number }[];
  /** First page of each juz (index 0 = juz 1). */
  juzStartPages: number[];
  /** The global number (1…6236) of each page's first ayah, to follow the recitation across pages. */
  pageFirstAyah: number[];
}
