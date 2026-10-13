/**
 * Builds the khatm-dua content from its sources, so no verse or hadith is typed by hand: Quranic
 * duas from quran.com's uthmani_tajweed text (what the Quran reader shows, colouring removed) and
 * prophetic duas from HadeethEnc (the text, its grade and its attribution).
 *
 *   node scripts/build-khatm-dua.mjs
 *
 * Writes src/features/khatmDua/khatmDuaContent.json — see src/features/khatmDua/CONTENT.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/features/khatmDua/khatmDuaContent.json");

/**
 * `start`: the dua begins mid-verse at this word (matched ignoring diacritics), after the words that
 * introduce it. `note`: why it suits the end of a khatma.
 */
const VERSES = [
  { key: "2:127", start: "ربنا", note: "دعا به إبراهيم وإسماعيل عليهما السلام بعد أن أتمّا بناء البيت" },
  { key: "2:128" },
  { key: "2:201", start: "ربنا", note: "أكثر دعاء النبي ﷺ — متفق عليه" },
  { key: "2:286", start: "ربنا" },
  { key: "3:8" },
  { key: "3:193" },
  { key: "3:194" },
  { key: "14:40" },
  { key: "14:41" },
  { key: "20:114", start: "رب" },
  { key: "25:74", start: "ربنا" },
  { key: "59:10", start: "ربنا" },
  { key: "66:8", start: "ربنا" },
];

/** HadeethEnc ids. The words to say are the hadith's quoted part (`last`: its last quote), from `after` on. */
const HADITHS = [
  { id: 5482, title: "صلاح الدين والدنيا والآخرة" },
  { id: 3596, title: "الهدى والتقى" },
  { id: 3142, title: "الثبات على الدين" },
  { id: 3518, title: "العون على الذكر والشكر", last: true, after: "تَقُولُ: " },
  { id: 5878, title: "زكاة النفس والعلم النافع" },
];

async function json(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return JSON.parse((await response.text()).replace(/^﻿/, ""));
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

/** The reader's own text (src/features/quran/tajweedApi.ts) without its colouring. */
function plainText(markup) {
  return markup
    .replace(/<span class=end>[^<]*<\/span>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/ٲ/g, "ٰ")
    .trim();
}

/** Letters only: drops harakat, Quranic marks and tatweel, and folds the alif forms. */
function skeleton(word) {
  return word.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا");
}

const quran = [];
for (const verse of VERSES) {
  const [surah, ayah] = verse.key.split(":").map(Number);
  const [{ verses }, { chapter }] = await Promise.all([
    json(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?verse_key=${verse.key}`),
    json(`https://api.quran.com/api/v4/chapters/${surah}?language=ar`),
  ]);
  let text = plainText(verses[0].text_uthmani_tajweed);
  let partial = false;
  if (verse.start) {
    const words = text.split(" ");
    const at = words.findIndex((word) => skeleton(word) === verse.start);
    if (at < 0) throw new Error(`"${verse.start}" not found in ${verse.key}`);
    partial = at > 0;
    text = words.slice(at).join(" ");
  }
  quran.push({
    key: verse.key,
    surahName: `سورة ${chapter.name_arabic}`,
    ayah,
    partial,
    text,
    ...(verse.note ? { note: verse.note } : {}),
  });
}

const sunnah = [];
for (const entry of HADITHS) {
  const hadith = await json(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${entry.id}`);
  const quotes = [...hadith.hadeeth.matchAll(/«([^»]+)»/g)];
  const quoted = entry.last ? quotes.at(-1) : quotes[0];
  if (!quoted) throw new Error(`No quoted words in ${entry.id}`);
  let dua = quoted[1];
  if (entry.after) {
    const start = dua.indexOf(entry.after);
    if (start < 0) throw new Error(`Marker not found in ${entry.id}`);
    dua = dua.slice(start + entry.after.length);
  }
  sunnah.push({
    id: `he-${entry.id}`,
    title: entry.title,
    dua: dua.trim().replace(/[.،]$/, ""),
    grade: hadith.grade,
    attribution: hadith.attribution,
    url: `https://hadeethenc.com/ar/browse/hadith/${entry.id}`,
  });
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({ quran, sunnah }, null, 2)}\n`);
console.log(`Wrote ${quran.length} Quranic and ${sunnah.length} prophetic duas.`);
