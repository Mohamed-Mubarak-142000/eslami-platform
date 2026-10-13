/**
 * Builds the Forty Nawawi Hadiths from HadeethEnc, so no hadith is typed by hand: the text, its
 * grade, attribution, explanation and lessons. Most entries come from HadeethEnc's set of Ibn Rajab's
 * Jami' al-'Ulum wal-Hikam (which holds al-Nawawi's 42); the rest from its general collection.
 *
 *   node scripts/build-nawawi.mjs
 *
 * Writes src/features/nawawi/nawawiContent.json — see src/features/nawawi/CONTENT.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/features/nawawi/nawawiContent.json");

/**
 * [number in al-Nawawi's book, HadeethEnc id, narrator as the exam names him]. The narrator is
 * checked against the hadith's own opening ("عن ...") so a wrong id fails the build.
 */
const HADITHS = [
  [1, 66511, "عمر بن الخطاب"],
  [2, 4563, "عمر بن الخطاب"],
  [3, 66512, "عبد الله بن عمر"],
  [4, 66513, "عبد الله بن مسعود"],
  [5, 66514, "عائشة أم المؤمنين"],
  [6, 66515, "النعمان بن بشير"],
  [7, 66516, "تميم الداري"],
  [8, 4211, "عبد الله بن عمر"],
  [9, 66517, "أبو هريرة"],
  [10, 66518, "أبو هريرة"],
  [11, 66519, "الحسن بن علي"],
  [12, 65255, "أبو هريرة"],
  [13, 66520, "أنس بن مالك"],
  [14, 4714, "عبد الله بن مسعود"],
  [15, 5437, "أبو هريرة"],
  [16, 4709, "أبو هريرة"],
  [17, 66521, "شداد بن أوس"],
  [18, 4302, "أبو ذر ومعاذ بن جبل"],
  [19, 66522, "عبد الله بن عباس"],
  [20, 66523, "أبو مسعود البدري"],
  [21, 66524, "سفيان بن عبد الله الثقفي"],
  [22, 66525, "جابر بن عبد الله"],
  [23, 66526, "أبو مالك الأشعري"],
  [24, 4810, "أبو ذر الغفاري"],
  [25, 4558, "أبو ذر الغفاري"],
  [26, 66527, "أبو هريرة"],
  [27, 66540, "النواس بن سمعان"],
  [28, 66529, "العرباض بن سارية"],
  [29, 66530, "معاذ بن جبل"],
  [30, 66510, "أبو ثعلبة الخشني"],
  [31, 4307, "سهل بن سعد الساعدي"],
  [32, 66531, "أبو سعيد الخدري"],
  [33, 66532, "عبد الله بن عباس"],
  [34, 65001, "أبو سعيد الخدري"],
  [35, 4706, "أبو هريرة"],
  [36, 4801, "أبو هريرة"],
  [37, 66533, "عبد الله بن عباس"],
  [38, 66534, "أبو هريرة"],
  [39, 4216, "عبد الله بن عباس"],
  [40, 4704, "عبد الله بن عمر"],
  [41, 66535, "عبد الله بن عمرو بن العاص"],
  [42, 5456, "أنس بن مالك"],
];

/** The words that must appear in the hadith's opening for each narrator (letters only). */
const NARRATOR_KEYS = {
  "عمر بن الخطاب": ["عمر"],
  "عبد الله بن عمر": ["ابن عمر", "عبد الله بن عمر"],
  "عبد الله بن مسعود": ["مسعود"],
  "عائشة أم المؤمنين": ["عائشه"],
  "النعمان بن بشير": ["النعمان"],
  "تميم الداري": ["تميم"],
  "أبو هريرة": ["هريره"],
  "الحسن بن علي": ["الحسن"],
  "أنس بن مالك": ["انس"],
  "شداد بن أوس": ["شداد"],
  "أبو ذر ومعاذ بن جبل": ["ذر", "معاذ"],
  "عبد الله بن عباس": ["عباس"],
  "أبو مسعود البدري": ["مسعود"],
  "سفيان بن عبد الله الثقفي": ["سفيان"],
  "جابر بن عبد الله": ["جابر"],
  "أبو مالك الأشعري": ["مالك"],
  "أبو ذر الغفاري": ["ذر"],
  "النواس بن سمعان": ["النواس"],
  "العرباض بن سارية": ["العرباض"],
  "معاذ بن جبل": ["معاذ"],
  "أبو ثعلبة الخشني": ["ثعلبه"],
  "سهل بن سعد الساعدي": ["سهل"],
  "أبو سعيد الخدري": ["سعيد"],
  "عبد الله بن عمرو بن العاص": ["عمرو"],
};

const PARTS = [
  { from: 1, to: 10 },
  { from: 11, to: 20 },
  { from: 21, to: 30 },
  { from: 31, to: 42 },
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

/** Letters only: drops harakat and tatweel, folds alif, ya and ta marbuta forms. */
function letters(text) {
  return text
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** HadeethEnc scatters zero-width non-joiners before some words (#34); they carry nothing. */
const clean = (text) => text.replace(/\u200C/g, "").trim();

const hadiths = [];
for (const [number, id, narrator] of HADITHS) {
  const hadith = await json(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`);
  // The opening names the narrator; the long ones (#2) are checked on their first sentence.
  const opening = letters(hadith.hadeeth.slice(0, 160));
  const keys = NARRATOR_KEYS[narrator];
  if (!keys?.some((key) => opening.includes(letters(key)))) throw new Error(`#${number}: narrator "${narrator}" not in "${opening}"`);
  const sayings = [...hadith.hadeeth.matchAll(/«([^»]+)»/g)].map((match) => clean(match[1]));
  if (sayings.length === 0) throw new Error(`#${number}: no quoted words`);
  hadiths.push({
    number,
    title: clean(hadith.title),
    narrator,
    hadith: clean(hadith.hadeeth),
    sayings,
    grade: hadith.grade,
    attribution: hadith.attribution.trim(),
    explanation: clean(hadith.explanation),
    lessons: hadith.hints.map(clean).filter(Boolean),
    url: `https://hadeethenc.com/ar/browse/hadith/${id}`,
  });
}

// The certificate's closing hadith, «من يرد الله به خيرًا يفقهه في الدين».
const quoteSource = await json("https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5518");
const quote = quoteSource.hadeeth.match(/«([^»]+)»/);
if (!quote) throw new Error("No quoted words in the certificate hadith");
// Its first sentence only: the rest of the hadith speaks of other matters.
const certificateQuote = { text: clean(quote[1].split("،")[0]), attribution: quoteSource.attribution.trim() };

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({ parts: PARTS, certificateQuote, hadiths }, null, 2)}\n`);
console.log(`Wrote ${hadiths.length} hadiths.`);
