/**
 * Builds what the seerah's chapters quote and draw, so no hadith, verse or coastline is typed by hand:
 * hadiths from HadeethEnc (text, grade, attribution), verses from quran.com's uthmani_tajweed text
 * (what the Quran reader shows, colouring removed), and the land of Arabia and its neighbours from
 * Natural Earth's public-domain 1:10m land polygons.
 *
 *   node scripts/build-seerah.mjs
 *
 * Writes src/features/seerah/seerahEvidence.json and src/features/seerah/arabiaMap.json — see
 * src/features/seerah/CONTENT.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE = join(ROOT, "src/features/seerah/seerahEvidence.json");
const MAP = join(ROOT, "src/features/seerah/arabiaMap.json");

/**
 * [key the chapters use, HadeethEnc id, words its text must contain]. The check catches a wrong id:
 * the build fails unless the hadith says what the chapter cites it for.
 */
const HADITHS = [
  // Before the mission
  ["lineage", 10859, "اصطفاني"],
  ["opened-chest", 10862, "زمزم"],
  ["shepherd", 6219, "رعي الغنم"],
  ["khadijah-only", 11176, "خديجة"],
  ["khadijah-memory", 3140, "خديجة"],
  ["khadijah-house", 3439, "قصب"],
  // Makkah
  ["first-revelation", 66303, "ورقة"],
  ["the-pause", 66304, "زملوني"],
  ["first-believers", 66307, "خمسة اعبد"],
  ["safa", 66306, "صباحاه"],
  ["entrails", 66308, "سلي جزور"],
  ["strangled", 11159, "عقبة بن ابي معيط"],
  ["khabbab", 4246, "المنشار"],
  ["najashi-prayer", 5396, "النجاشي"],
  ["ship-people", 66346, "السفينة"],
  ["taif", 6406, "ملك الجبال"],
  ["sidrah", 66316, "سدرة المنتهي"],
  ["five-prayers", 66313, "خمس صلوات"],
  ["quraysh-ask", 66315, "بيت المقدس"],
  ["aqabah-pledge", 66210, "العقبة"],
  // The Hijrah
  ["mission-years", 10975, "ثلاث عشرة سنة"],
  ["first-emigrants", 66318, "مصعب بن عمير"],
  ["cave", 3447, "ثالثهما"],
  ["arrival", 66320, "سراقة"],
  ["quba-and-mosque", 65405, "ثامنوني"],
  ["abu-ayyub", 66321, "السفل ارفق"],
  ["ansar-share", 66347, "الانصار"],
  ["love-of-madinah", 66324, "حبب الينا المدينة"],
  // Madinah
  ["badr-count", 65774, "يوم بدر"],
  ["badr-dua", 10555, "انجز لي"],
  ["abu-jahl", 66331, "ابا جهل"],
  ["badr-people", 4925, "اهل بدر"],
  ["archers", 66335, "لا تبرحوا"],
  ["wounds", 65776, "رباعيته"],
  ["hamza", 66338, "حمزة"],
  ["uhud-loves", 65691, "يحبنا"],
  ["trench-dig", 65779, "لولا الله"],
  ["trench-rock", 5818, "كدية"],
  ["confederates-night", 66339, "الاحزاب"],
  ["now-we-march", 65780, "نغزوهم"],
  ["hudaybiyah-well", 65785, "الحديبية"],
  ["ridwan", 66341, "الشجرة"],
  ["treaty", 66342, "اكتب"],
  ["letters", 65789, "كسري"],
  ["seal", 66053, "محمد سطر"],
  ["heraclius", 66343, "هرقل"],
  ["kisra", 65790, "مزقه"],
  ["khaybar-march", 65792, "خيبر"],
  ["khaybar-dawn", 66344, "خربت خيبر"],
  ["ali-flag", 10956, "الراية"],
  ["mutah-commanders", 65796, "مؤتة"],
  ["mutah-news", 65797, "خالد بن الوليد"],
  ["jafar", 11187, "جعفرا"],
  ["khalid-swords", 8407, "مؤتة"],
  // The conquest and after
  ["hatib", 66351, "حاطب"],
  ["idols", 65799, "نصب"],
  ["in-the-kaaba", 65683, "الكعبة"],
  ["ansar-fath", 10846, "المحيا محياكم"],
  ["hunayn", 8267, "السمرة"],
  ["taif-siege", 65800, "الطائف"],
  ["hawazin", 65801, "هوازن"],
  ["tabuk-plain", 64603, "تبوك"],
  ["tabuk-food", 4955, "تبوك"],
  ["kab", 4820, "خمسين ليلة"],
  ["welcome-back", 3696, "ثنية الوداع"],
  ["jabir-hajj", 10622, "دماءكم"],
  ["tawaf-camel", 3025, "بمحجن"],
  ["perfected", 65298, "اكملت"],
  ["farewell-talk", 5829, "حجة الوداع"],
  ["aishas-house", 58131, "اين انا غدا"],
  ["abu-bakr-leads", 4179, "ابا بكر"],
  ["last-look", 10976, "الستارة"],
  ["highest-companion", 10988, "الرفيق الاعلي"],
  ["abu-bakr-speech", 66360, "من كان يعبد محمدا"],
  ["left-nothing", 10987, "دينارا"],
];

/**
 * [key, verse, the word the quote starts at, the word it ends at, which occurrence of the start word]
 * — the whole verse when the words are null.
 */
const VERSES = [
  ["elephant", "105:1", null, null],
  ["iqra", "96:1", null, null],
  ["arise", "74:2", null, null],
  ["warn-kin", "26:214", null, null],
  ["isra", "17:1", null, null],
  ["plot", "8:30", null, null],
  ["two-in-the-cave", "9:40", "الا", "معنا"],
  ["ansar", "59:9", "والذين", "اليهم"],
  ["badr-help", "3:123", null, null],
  ["badr-call", "8:9", null, null],
  ["uhud-comfort", "3:139", null, null],
  ["confederates-fear", "33:10", null, null],
  ["confederates-wind", "33:9", null, null],
  ["tree-pledge", "48:18", null, null],
  ["clear-victory", "48:1", null, null],
  ["common-word", "3:64", null, null],
  ["truth-came", "17:81", null, null],
  ["hunayn", "9:25", null, null],
  ["three-left", "9:118", null, null],
  ["religion-perfected", "5:3", "اليوم", "دينا", 2],
  ["messenger", "3:144", "وما", "الرسل"],
  ["you-will-die", "39:30", null, null],
];

/** What the map covers: Abyssinia to Syria and Ctesiphon, the Nile to the Gulf. */
const BOUNDS = { west: 32, east: 52, south: 12, north: 34 };
/** Map units per degree of latitude; longitude shrinks by the cosine of the middle latitude. */
const SCALE = 60;
/** Drops coastline wiggles smaller than this many map units, and islands smaller than its square times this. */
const TOLERANCE = 0.35;
const MIN_ISLAND = 40;

async function json(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return JSON.parse((await response.text()).replace(/^﻿/, ""));
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

/** Letters only: drops harakat, Quranic marks and tatweel, and folds the alif forms. */
function letters(text) {
  return text
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ‌]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي");
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

/** HadeethEnc marks a verse inside a hadith as @{…}*; the braces stay, the marks go. */
const clean = (text) => text.replace(/‌/g, "").replace(/@\{/g, "{").replace(/\}\*/g, "}").trim();

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
const surahNames = Object.fromEntries(
  (await json("https://api.quran.com/api/v4/chapters?language=ar")).chapters.map((chapter) => [chapter.id, chapter.name_arabic]),
);
for (const [key, verseKey, from, to, occurrence = 1] of VERSES) {
  const {
    verses: [verse],
  } = await json(`https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?verse_key=${verseKey}`);
  let text = plainText(verse.text_uthmani_tajweed);
  if (from) {
    const words = text.split(" ");
    const start = words.findIndex(
      (word, index) => letters(word) === from && words.slice(0, index + 1).filter((entry) => letters(entry) === from).length === occurrence,
    );
    const end = words.findIndex((word, index) => index >= start && letters(word) === to);
    if (start < 0 || end < 0) throw new Error(`"${from}…${to}" not found in ${verseKey}`);
    // The pause mark after the last word belongs to the verse's next clause.
    text = words
      .slice(start, end + 1)
      .join(" ")
      .replace(/[‌ۖ-ۜ]+$/, "");
  }
  const [surah, ayah] = verseKey.split(":").map(Number);
  verses[key] = { text, surah, surahName: surahNames[surah], ayah, partial: Boolean(from), audio: verse.id };
}

await mkdir(dirname(EVIDENCE), { recursive: true });
await writeFile(EVIDENCE, `${JSON.stringify({ hadiths, verses }, null, 2)}\n`);
console.log(`Wrote ${Object.keys(hadiths).length} hadiths and ${Object.keys(verses).length} verses.`);

// The map: an equirectangular projection around the middle latitude, which keeps the Hijaz's shape
// at this size. src/features/seerah/seerahContent.ts projects places with the same numbers.
const cosLat = Math.cos((((BOUNDS.north + BOUNDS.south) / 2) * Math.PI) / 180);
const project = ([lon, lat]) => [(lon - BOUNDS.west) * cosLat * SCALE, (BOUNDS.north - lat) * SCALE];
const width = (BOUNDS.east - BOUNDS.west) * cosLat * SCALE;
const height = (BOUNDS.north - BOUNDS.south) * SCALE;

/** Sutherland–Hodgman against the map's rectangle; a filled ring stays filled along the cut. */
function clip(ring) {
  const edges = [(p) => p[0] >= BOUNDS.west, (p) => p[0] <= BOUNDS.east, (p) => p[1] >= BOUNDS.south, (p) => p[1] <= BOUNDS.north];
  const cuts = [
    (a, b) => along(a, b, (BOUNDS.west - a[0]) / (b[0] - a[0])),
    (a, b) => along(a, b, (BOUNDS.east - a[0]) / (b[0] - a[0])),
    (a, b) => along(a, b, (BOUNDS.south - a[1]) / (b[1] - a[1])),
    (a, b) => along(a, b, (BOUNDS.north - a[1]) / (b[1] - a[1])),
  ];
  let points = ring;
  edges.forEach((inside, edge) => {
    const input = points;
    points = [];
    input.forEach((current, index) => {
      const previous = input[(index + input.length - 1) % input.length];
      if (inside(current)) {
        if (!inside(previous)) points.push(cuts[edge](previous, current));
        points.push(current);
      } else if (inside(previous)) points.push(cuts[edge](previous, current));
    });
  });
  return points;
}

const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Douglas–Peucker, iterative so the long African coast doesn't overflow the stack. */
function simplify(points) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    let farthest = -1;
    let distance = TOLERANCE;
    for (let index = first + 1; index < last; index++) {
      const [px, py] = points[index];
      const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
      if (d > distance) [farthest, distance] = [index, d];
    }
    if (farthest > 0) {
      keep[farthest] = 1;
      stack.push([first, farthest], [farthest, last]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

const area = (points) =>
  Math.abs(points.reduce((sum, [x, y], i) => sum + x * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * y, 0)) / 2;

const land = await json("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson");
const rings = [];
for (const feature of land.features) {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const clipped = clip(ring.slice(0, -1));
      if (clipped.length < 3) continue;
      const points = simplify(clipped.map(project));
      if (points.length >= 3 && area(points) >= MIN_ISLAND * TOLERANCE * TOLERANCE) rings.push(points);
    }
  }
}
const round = (value) => Math.round(value * 10) / 10;
const path = rings.map((ring) => `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`).join("");

await writeFile(
  MAP,
  `${JSON.stringify({ bounds: BOUNDS, scale: SCALE, cosLat, width: round(width), height: round(height), land: path }, null, 2)}\n`,
);
console.log(`Wrote the map: ${rings.length} rings, ${rings.reduce((sum, ring) => sum + ring.length, 0)} points.`);
