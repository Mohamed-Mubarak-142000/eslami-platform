/**
 * The riwayat whose full mushaf the King Fahd Complex publishes. Every riwaya other than Hafs is
 * read from its own mushaf (src/data/riwayat, built by scripts/build-riwayat.mjs): its own text,
 * ayah numbering, pages and typeface. `audio` holds the matching mp3quran riwaya ids for listening;
 * the 20 riwayat of the ten qira'at aren't all available as text.
 */
export const RIWAYAT = [
  { key: "hafs", label: "حفص عن عاصم", short: "حفص", audio: [1] },
  { key: "shouba", label: "شعبة عن عاصم", short: "شعبة", audio: [15] },
  { key: "warsh", label: "ورش عن نافع", short: "ورش", audio: [2, 18, 10] },
  { key: "qaloon", label: "قالون عن نافع", short: "قالون", audio: [5, 8] },
  { key: "bazzi", label: "البزّي عن ابن كثير", short: "البزّي", audio: [4, 11] },
  { key: "qumbul", label: "قنبل عن ابن كثير", short: "قنبل", audio: [6, 11] },
  { key: "doori", label: "الدوري عن أبي عمرو", short: "الدوري", audio: [13] },
  { key: "soosi", label: "السوسي عن أبي عمرو", short: "السوسي", audio: [7] },
] as const;

export type Riwaya = (typeof RIWAYAT)[number];
export type RiwayaKey = Riwaya["key"];
export type OtherRiwayaKey = Exclude<RiwayaKey, "hafs">;

export const DEFAULT_RIWAYA: Riwaya = RIWAYAT[0];
/** The reader's last choice, so a new surah opens in the same riwaya. */
export const RIWAYA_STORAGE_KEY = "al-manara:quran-riwaya:v1";

export function findRiwaya(key: unknown): Riwaya {
  return RIWAYAT.find((riwaya) => riwaya.key === key) ?? DEFAULT_RIWAYA;
}
