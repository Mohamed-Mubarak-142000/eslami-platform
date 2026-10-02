/**
 * Vendors the King Fahd Complex (KFGQPC) text and font of each non-Hafs riwaya, from
 * github.com/thetruetruth/quran-data-kfgqpc pinned to one commit so the Quran text never changes
 * underneath us. Each riwaya keeps its own mushaf: its own ayah numbering, page and juz.
 *
 *   node scripts/build-riwayat.mjs
 *
 * Writes src/data/riwayat/<key>.json and src/assets/fonts/riwayat/<key>.woff2.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMMIT = "281dbbe8eed1370daa5a023b6cd81655cbfd6473";
const BASE = `https://cdn.jsdelivr.net/gh/thetruetruth/quran-data-kfgqpc@${COMMIT}`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = {
  shouba: { data: "shouba/data/ShoubaData08.json", font: "shouba/font/shouba.8.woff2" },
  warsh: { data: "warsh/data/warshData_v10.json", font: "warsh/font/warsh.10.woff2" },
  qaloon: { data: "qaloon/data/QaloonData_v10.json", font: "qaloon/font/qaloon.10.woff2" },
  bazzi: { data: "bazzi/data/BazziData_v07.json", font: "bazzi/font/bazzi.7.woff2" },
  qumbul: { data: "qumbul/data/QumbulData_v07.json", font: "qumbul/font/qumbul.7.woff2" },
  doori: { data: "doori/data/DooriData_v09.json", font: "doori/font/doori.9.woff2" },
  soosi: { data: "soosi/data/SoosiData09.json", font: "soosi/font/soosi.9.woff2" },
};

// The source ends every ayah with its number (Arabic-Indic digits, sometimes a trailing RLM);
// the reader draws the number itself.
const TRAILING_NUMBER = /\s*[٠-٩]+[‏\s]*$/;
const BASMALA_START = /بِس[ْۡ]مِ/;

async function fetchOk(path) {
  const response = await fetch(`${BASE}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}

function clean(text) {
  return text.replace(/^﻿/, "").replace(TRAILING_NUMBER, "").replace(/\s+/g, " ").trim();
}

async function buildRiwaya(key, source) {
  const raw = JSON.parse((await (await fetchOk(source.data)).text()).replace(/^﻿/, ""));
  const ayahs = [];
  let previous = null;
  for (const row of raw) {
    const surah = row.sura_no;
    const ayah = row.aya_no;
    // An ayah printed across two pages ("34-35") belongs to the page it starts on.
    const page = Number.parseInt(String(row.page), 10);
    const expected = previous && (surah === previous.surah ? previous.ayah + 1 : 1);
    if (previous && (surah < previous.surah || ayah !== expected || page < previous.page))
      throw new Error(`${key}: out of order at ${surah}:${ayah}`);
    if (!Number.isInteger(page) || page < 1 || page > 604) throw new Error(`${key}: bad page at ${surah}:${ayah}`);
    ayahs.push([surah, ayah, page, row.jozz, clean(row.aya_text)]);
    previous = { surah, ayah, page };
  }
  if (new Set(ayahs.map(([surah]) => surah)).size !== 114) throw new Error(`${key}: missing surahs`);

  // The basmala in this riwaya's own spelling, cut from an-Naml 27:30 rather than typed by hand.
  const naml30 = ayahs.find(([surah, ayah]) => surah === 27 && ayah === 30)?.[4] ?? "";
  const start = naml30.search(BASMALA_START);
  if (start === -1) throw new Error(`${key}: basmala not found in 27:30`);
  const basmala = naml30.slice(start);

  await writeFile(join(ROOT, "src/data/riwayat", `${key}.json`), JSON.stringify({ basmala, ayahs }));
  const font = Buffer.from(await (await fetchOk(source.font)).arrayBuffer());
  await writeFile(join(ROOT, "src/assets/fonts/riwayat", `${key}.woff2`), font);
  console.log(`${key}: ${ayahs.length} ayahs, basmala "${basmala}"`);
}

await mkdir(join(ROOT, "src/data/riwayat"), { recursive: true });
await mkdir(join(ROOT, "src/assets/fonts/riwayat"), { recursive: true });
for (const [key, source] of Object.entries(SOURCES)) await buildRiwaya(key, source);
