/**
 * Builds the ruqyah page's content from its sources, so no verse or hadith is typed by hand:
 * the verses from quran.com's uthmani_tajweed text, exactly what the Quran reader shows (with the
 * colouring removed), and the prophetic ruqyah from HadeethEnc (the text,
 * its grade and its attribution).
 *
 *   node scripts/build-ruqyah.mjs
 *
 * Writes src/features/ruqyah/ruqyahContent.json — see src/features/ruqyah/CONTENT.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/features/ruqyah/ruqyahContent.json");

/** `sunnah`: the Sunnah names this passage for protection or healing; the rest are the reciters' customary selection. */
const PASSAGES = [
  { id: "fatiha", title: "سورة الفاتحة", surah: 1, from: 1, to: 7, sunnah: "رقى بها الصحابي اللديغ فبرأ، وأقرّه النبي ﷺ — متفق عليه" },
  { id: "baqarah-start", title: "أول سورة البقرة", surah: 2, from: 1, to: 5 },
  { id: "kursi", title: "آية الكرسي", surah: 2, from: 255, to: 255, sunnah: "لا يزال عليك من الله حافظ، ولا يقربك شيطان — رواه البخاري" },
  { id: "baqarah-end", title: "خواتيم سورة البقرة", surah: 2, from: 285, to: 286, sunnah: "من قرأهما في ليلة كفتاه — متفق عليه" },
  { id: "imran", title: "من سورة آل عمران", surah: 3, from: 18, to: 19 },
  { id: "araf-54", title: "من سورة الأعراف", surah: 7, from: 54, to: 56 },
  { id: "araf-117", title: "من سورة الأعراف", surah: 7, from: 117, to: 122 },
  { id: "yunus", title: "من سورة يونس", surah: 10, from: 79, to: 82 },
  { id: "taha", title: "من سورة طه", surah: 20, from: 65, to: 69 },
  { id: "muminun", title: "خواتيم سورة المؤمنون", surah: 23, from: 115, to: 118 },
  { id: "saffat", title: "أول سورة الصافات", surah: 37, from: 1, to: 10 },
  { id: "ahqaf", title: "من سورة الأحقاف", surah: 46, from: 29, to: 32 },
  { id: "rahman", title: "من سورة الرحمن", surah: 55, from: 33, to: 36 },
  { id: "hashr", title: "خواتيم سورة الحشر", surah: 59, from: 21, to: 24 },
  { id: "jinn", title: "أول سورة الجن", surah: 72, from: 1, to: 9 },
  {
    id: "ikhlas",
    title: "سورة الإخلاص",
    surah: 112,
    from: 1,
    to: 4,
    repeat: 3,
    sunnah: "المعوذات ثلاثًا تكفيك من كل شيء — رواه أبو داود والترمذي",
  },
  {
    id: "falaq",
    title: "سورة الفلق",
    surah: 113,
    from: 1,
    to: 5,
    repeat: 3,
    sunnah: "كان النبي ﷺ إذا اشتكى نفث على نفسه بالمعوذات — رواه البخاري",
  },
  {
    id: "nas",
    title: "سورة الناس",
    surah: 114,
    from: 1,
    to: 6,
    repeat: 3,
    sunnah: "كان النبي ﷺ إذا اشتكى نفث على نفسه بالمعوذات — رواه البخاري",
  },
];

/** HadeethEnc ids. `dua` picks the words to say out of the hadith; omitted, the hadith is an instruction. */
const HADITHS = [
  { id: 5542, title: "أذهب البأس رب الناس", dua: "quote" },
  { id: 5541, title: "رقية النبي ﷺ", dua: "quote" },
  { id: 5650, title: "رقية جبريل للنبي ﷺ", dua: "quote", last: true },
  { id: 6018, title: "لمن أحسّ وجعًا في جسده", dua: "quote" },
  { id: 6270, title: "الدعاء للمريض", dua: "quote", after: "سَبْعَ مِرَارٍ: ", until: "،", repeat: 7 },
  { id: 66082, title: "تعويذ الأولاد", dua: "quote", after: "إِسْحَاقَ: " },
  { id: 6113, title: "رقية القرحة والجرح", dua: "quote" },
  { id: 66083, title: "النفث بالمعوذات" },
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

/**
 * The reader's own text (src/features/quran/tajweedApi.ts) without its colouring: the verse-end
 * marker dropped, the tags and stray brackets removed, and U+0672 mapped back to the dagger alif.
 */
function plainText(markup) {
  return markup
    .replace(/<span class=end>[^<]*<\/span>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/ٲ/g, "ٰ")
    .trim();
}

const quran = [];
for (const passage of PASSAGES) {
  const [{ verses }, { chapter }] = await Promise.all([
    json(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${passage.surah}`),
    json(`https://api.quran.com/api/v4/chapters/${passage.surah}?language=ar`),
  ]);
  const ayahs = verses
    .map((verse) => ({
      numberInSurah: Number(verse.verse_key.split(":")[1]),
      number: verse.id,
      text: plainText(verse.text_uthmani_tajweed),
    }))
    .filter((ayah) => ayah.numberInSurah >= passage.from && ayah.numberInSurah <= passage.to);
  if (ayahs.length !== passage.to - passage.from + 1 || ayahs[0].numberInSurah !== passage.from) {
    throw new Error(`Unexpected ayahs for ${passage.id}`);
  }
  const { from, to, ...rest } = passage;
  quran.push({ ...rest, surahName: `سورة ${chapter.name_arabic}`, from, to, ayahs });
}

const sunnah = [];
for (const entry of HADITHS) {
  const hadith = await json(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${entry.id}`);
  let dua = null;
  if (entry.dua === "quote") {
    const quotes = [...hadith.hadeeth.matchAll(/«([^»]+)»/g)];
    const quoted = entry.last ? quotes.at(-1) : quotes[0];
    if (!quoted) throw new Error(`No quoted words in ${entry.id}`);
    dua = quoted[1];
    if (entry.after) {
      const start = dua.indexOf(entry.after);
      if (start < 0) throw new Error(`Marker not found in ${entry.id}`);
      dua = dua.slice(start + entry.after.length);
    }
    if (entry.until) {
      const end = dua.indexOf(entry.until);
      if (end < 0) throw new Error(`End marker not found in ${entry.id}`);
      dua = dua.slice(0, end);
    }
    dua = dua.trim().replace(/[.،]$/, "");
  }
  sunnah.push({
    id: `he-${entry.id}`,
    title: entry.title,
    dua,
    hadith: hadith.hadeeth.trim(),
    grade: hadith.grade,
    attribution: hadith.attribution,
    url: `https://hadeethenc.com/ar/browse/hadith/${entry.id}`,
    ...(entry.repeat ? { repeat: entry.repeat } : {}),
  });
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({ quran, sunnah }, null, 2)}\n`);
console.log(`Wrote ${quran.length} passages (${quran.reduce((sum, p) => sum + p.ayahs.length, 0)} ayahs) and ${sunnah.length} hadiths.`);
