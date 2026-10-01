/**
 * The riwayat whose full text the King Fahd Complex publishes (via fawazahmed0/quran-api, in Hafs
 * ayah numbering so a page's ayahs map one to one). `audio` holds the matching mp3quran riwaya ids
 * for listening; the 20 riwayat of the ten qira'at aren't all available as text.
 */
export const RIWAYAT = [
  { key: "hafs", label: "حفص عن عاصم", short: "حفص", edition: null, audio: [1] },
  { key: "shouba", label: "شعبة عن عاصم", short: "شعبة", edition: "ara-quranshouba", audio: [15] },
  { key: "warsh", label: "ورش عن نافع", short: "ورش", edition: "ara-quranwarsh", audio: [2, 18, 10] },
  { key: "qaloon", label: "قالون عن نافع", short: "قالون", edition: "ara-quranqaloon", audio: [5, 8] },
  { key: "bazzi", label: "البزّي عن ابن كثير", short: "البزّي", edition: "ara-quranbazzi", audio: [4, 11] },
  { key: "qumbul", label: "قنبل عن ابن كثير", short: "قنبل", edition: "ara-quranqumbul", audio: [6, 11] },
  { key: "doori", label: "الدوري عن أبي عمرو", short: "الدوري", edition: "ara-qurandoori", audio: [13] },
  { key: "soosi", label: "السوسي عن أبي عمرو", short: "السوسي", edition: "ara-quransoosi", audio: [7] },
] as const;

export type Riwaya = (typeof RIWAYAT)[number];
export type RiwayaKey = Riwaya["key"];

export const DEFAULT_RIWAYA: Riwaya = RIWAYAT[0];
/** The reader's last choice, so a new surah opens in the same riwaya. */
export const RIWAYA_STORAGE_KEY = "al-manara:quran-riwaya:v1";

export function findRiwaya(key: unknown): Riwaya {
  return RIWAYAT.find((riwaya) => riwaya.key === key) ?? DEFAULT_RIWAYA;
}
