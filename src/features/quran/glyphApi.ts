import type { GlyphEdition, MushafLine } from "./mushafPageTypes";

/*
 * The printed Madinah page, line by line, from quran.com: each word as a glyph code of the King Fahd
 * Complex's per-page font (QCF), with the line it sits on. V1 is the 1405 print, whose page breaks
 * match the rest of the site (alquran.cloud's page numbers); the tajweed font is drawn on the 1421
 * print (V2), whose layout differs on 25 pages.
 */

const BASE_URL = "https://api.quran.com/api/v4";
const REVALIDATE = 60 * 60 * 24 * 30;

/** quran.com's mushaf ids, which pick the page and line numbers the words report. */
const MUSHAF_ID: Record<GlyphEdition, number> = { v1: 2, tajweed: 1 };
const CODE_FIELD: Record<GlyphEdition, "code_v1" | "code_v2"> = { v1: "code_v1", tajweed: "code_v2" };

interface RawWord {
  char_type_name: string;
  line_number: number;
  page_number: number;
  code_v1?: string;
  code_v2?: string;
}

interface RawVerse {
  id: number;
  verse_key: string;
  words: RawWord[];
}

async function versesOfPage(page: number, edition: GlyphEdition): Promise<RawVerse[]> {
  const verses: RawVerse[] = [];
  for (let part = 1; ; part += 1) {
    const params = new URLSearchParams({
      words: "true",
      word_fields: `${CODE_FIELD[edition]},line_number,page_number`,
      per_page: "50",
      page: String(part),
      mushaf: String(MUSHAF_ID[edition]),
    });
    const response = await fetch(`${BASE_URL}/verses/by_page/${page}?${params}`, { next: { revalidate: REVALIDATE } });
    if (!response.ok) throw new Error(`quran.com page ${page}: ${response.status}`);
    const data = (await response.json()) as { verses: RawVerse[]; pagination: { next_page: number | null } };
    verses.push(...data.verses);
    if (!data.pagination.next_page) return verses;
  }
}

/** Pages 1 and 2 (al-Fatiha and the opening of al-Baqara) are printed on 8 lines, the rest on 15. */
const linesOnPage = (page: number) => (page <= 2 ? 8 : 15);

/**
 * The page's lines. A verse that starts on the page before can run onto this one, so both pages'
 * verses are read and only the words printed here kept. Lines with no words hold a surah's title and
 * basmala: before its first ayah, or at the foot of the page when the surah starts overleaf.
 */
export async function getGlyphLines(
  page: number,
  edition: GlyphEdition,
  surahName: (surah: number) => string,
): Promise<MushafLine[] | null> {
  const [previous, current] = await Promise.all([page > 1 ? versesOfPage(page - 1, edition) : [], versesOfPage(page, edition)]);
  const total = linesOnPage(page);
  const byLine = new Map<number, { surah: number; ayah: number; code: string; id: number; end: boolean }[]>();
  for (const verse of [...previous, ...current]) {
    const [surah, ayah] = verse.verse_key.split(":").map(Number) as [number, number];
    for (const word of verse.words) {
      const code = word[CODE_FIELD[edition]];
      if (word.page_number !== page || !code) continue;
      const line = byLine.get(word.line_number) ?? [];
      line.push({ surah, ayah, code, id: verse.id, end: word.char_type_name === "end" });
      byLine.set(word.line_number, line);
    }
  }
  if (byLine.size === 0 || Math.max(...byLine.keys()) > total) return null;

  const lines: MushafLine[] = [];
  for (let number = 1; number <= total; number += 1) {
    const words = byLine.get(number);
    if (words) {
      lines.push({ kind: "words", words: words.map(({ code, id, end }) => ({ code, ayah: id, end })) });
      continue;
    }
    // A run of empty lines: the surah it introduces, and whether it ends the page.
    let last = number;
    while (last + 1 <= total && !byLine.has(last + 1)) last += 1;
    const next = byLine.get(last + 1)?.[0];
    const lastWord = byLine.get(Math.max(...byLine.keys()))!.at(-1)!;
    const surah = next ? next.surah : lastWord.surah + 1;
    // Al-Fatiha's basmala is its first ayah, and at-Tawba has none.
    const opening: MushafLine[] =
      surah === 1 || surah === 9
        ? [{ kind: "surah", surah, name: surahName(surah) }]
        : [{ kind: "surah", surah, name: surahName(surah) }, { kind: "basmala" }];
    const count = last - number + 1;
    const fill = next ? opening.slice(-count) : opening.slice(0, count);
    if (fill.length !== count || (next && next.ayah !== 1) || surah > 114) return null;
    lines.push(...fill);
    number = last;
  }
  return lines;
}
