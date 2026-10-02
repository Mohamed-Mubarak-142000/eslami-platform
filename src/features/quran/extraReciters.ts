import type { Reciter } from "./api";

// Reciters missing from mp3quran, served from public archive.org uploads.
// IDs start at 900000 so they never collide with mp3quran ids.

const ARCHIVE = "https://archive.org/download/";
const HAFS = 1;
const MURATTAL = 11;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

function archiveReciter(id: number, name: string, item: string, surahList: number[]): Reciter {
  return {
    id,
    name,
    letter: name.charAt(0),
    moshaf: [{ id, name: "حفص عن عاصم - مرتل", rewayaId: HAFS, moshafType: MURATTAL, server: `${ARCHIVE}${item}/`, surahList }],
  };
}

export const EXTRA_RECITERS: Reciter[] = [
  archiveReciter(900001, "أحمد عبدالرازق نصر", "AhmedAbdelrazekNasr", range(1, 114)),
  archiveReciter(
    900002,
    "باسل مؤنس",
    "basil-mounes",
    [
      1, 2, 4, 7, 8, 9, 11, 14, 15, 16, 18, 20, 22, 23, 25, 28, 29, 30, 31, 34, 35, 37, 42, 43, 44, 46, 47, 50, 52, 53, 54, 55, 56, 57, 59,
      60, 61, 62, 63, 64, 67, 68, 69, 73, 74, 75, 77, 78, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 99, 103, 106, 107, 109, 112, 113,
      114,
    ],
  ),
  archiveReciter(900003, "محمد الكنتاوي", "MohamedElkantawy", range(1, 114)),
  archiveReciter(
    900004,
    "حازم سيف",
    "HazemSeif",
    [
      2, 3, 6, 9, 11, 12, 15, 18, 19, 20, 21, 22, 24, 27, 29, 33, 35, 36, 37, 39, 40, 41, 45, 51, 52, 54, 55, 56, 57, 69, 75, 79, 80, 81,
      82, 83, 84, 85,
    ],
  ),
  archiveReciter(900005, "حمزة بوديب", "HamzaBoudib", [16, 21, 44, 50, 53, 55, 56, 59, 67, 68, 70, 74, 77, 78, 83, 89]),
];
