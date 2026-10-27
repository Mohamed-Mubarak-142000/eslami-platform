/**
 * Builds the evidence the umrah guide quotes, so no hadith or verse is typed by hand: hadiths from
 * HadeethEnc (text, grade, attribution) and verses from quran.com's uthmani_tajweed text (what the
 * Quran reader shows, colouring removed). The duas themselves come from the Hisn al-Muslim snapshot
 * in src/features/adhkar, with its recordings.
 *
 *   node scripts/build-umrah.mjs
 *
 * Writes src/features/umrah/umrahEvidence.json — see src/features/umrah/CONTENT.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/features/umrah/umrahEvidence.json");

/**
 * [key the guide uses, HadeethEnc id, words its text must contain]. The check catches a wrong id:
 * the build fails unless the hadith says what the guide cites it for.
 */
const HADITHS = [
  ["umrah-expiation", 65626, "العمرة إلى العمرة"],
  ["umrah-ramadan", 2753, "رمضان"],
  ["mawaqit", 65628, "ذا الحليفة"],
  ["ihram-clothes", 4544, "القميص"],
  ["ihram-perfume", 65631, "لإحرامه"],
  ["talbiya", 4535, "لبيك"],
  ["black-stone", 3024, "حجر"],
  ["two-corners", 3026, "الركنين"],
  ["ramal", 65645, "فرملوا"],
  ["safa-marwa", 65270, "الصفا"],
  ["shaving", 7185, "المحلقين"],
  ["women-shorten", 65663, "التقصير"],
  ["prophet-mosque", 65090, "مسجدي"],
  ["rawdah", 65408, "روضة"],
  ["quba-reward", 65409, "قباء"],
];

/** [key, verse, the word the quote starts at, the word it ends at] — the whole verse when null. */
const VERSES = [
  ["maqam", "2:125", "واتخذوا", "مصلي"],
  ["safa-verse", "2:158", null, null],
];

async function json(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return JSON.parse((await response.text()).replace(/^\uFEFF/, ""));
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

/** Letters only: drops harakat, Quranic marks and tatweel, and folds the alif forms. */
function letters(text) {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200C]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي");
}

/** The reader's own text (src/features/quran/tajweedApi.ts) without its colouring. */
function plainText(markup) {
  return markup
    .replace(/<span class=end>[^<]*<\/span>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\u0672/g, "\u0670")
    .trim();
}

const clean = (text) => text.replace(/\u200C/g, "").trim();

const hadiths = {};
for (const [key, id, mustContain] of HADITHS) {
  const hadith = await json(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`);
  if (!letters(hadith.hadeeth).includes(letters(mustContain))) throw new Error(`${key} (#${id}) doesn't mention "${mustContain}"`);
  hadiths[key] = {
    text: clean(hadith.hadeeth),
    grade: hadith.grade,
    attribution: hadith.attribution.trim(),
    url: `https://hadeethenc.com/ar/browse/hadith/${id}`,
  };
}

const verses = {};
for (const [key, verseKey, from, to] of VERSES) {
  const {
    verses: [verse],
  } = await json(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?verse_key=${verseKey}`);
  let text = plainText(verse.text_uthmani_tajweed);
  if (from) {
    const words = text.split(" ");
    const start = words.findIndex((word) => letters(word) === from);
    const end = words.findIndex((word, index) => index >= start && letters(word) === to);
    if (start < 0 || end < 0) throw new Error(`"${from}…${to}" not found in ${verseKey}`);
    // The pause mark after the last word belongs to the verse's next clause.
    text = words
      .slice(start, end + 1)
      .join(" ")
      .replace(/[\u200C\u06D6-\u06DC]+$/, "");
  }
  const [surah, ayah] = verseKey.split(":").map(Number);
  verses[key] = { text, surah, ayah, partial: Boolean(from), audio: verse.id };
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({ hadiths, verses }, null, 2)}\n`);
console.log(`Wrote ${Object.keys(hadiths).length} hadiths and ${Object.keys(verses).length} verses.`);
