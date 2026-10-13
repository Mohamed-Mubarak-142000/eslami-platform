import content from "./ruqyahContent.json";
import { alafasyAyahUrl } from "@/features/quran/ayahAudio";
import type { AudioTrack } from "@/features/audio/AudioProvider";

export interface RuqyahPassage {
  id: string;
  title: string;
  surah: number;
  surahName: string;
  from: number;
  to: number;
  /** Why the Sunnah names this passage; absent for the reciters' customary selection. */
  sunnah?: string;
  repeat?: number;
  ayahs: { numberInSurah: number; number: number; text: string }[];
}

export interface RuqyahHadith {
  id: string;
  title: string;
  /** The words to say, or null when the hadith describes a practice. */
  dua: string | null;
  hadith: string;
  grade: string;
  attribution: string;
  url: string;
  repeat?: number;
}

// Built by scripts/build-ruqyah.mjs from its sources — see CONTENT.md.
export const RUQYAH_QURAN = content.quran as RuqyahPassage[];
export const RUQYAH_SUNNAH = content.sunnah as RuqyahHadith[];

/** One track per ayah, the passage read `repeat` times over. */
export function passageTracks(passage: RuqyahPassage): AudioTrack[] {
  return Array.from({ length: passage.repeat ?? 1 }, (_, round) =>
    passage.ayahs.map((ayah) => ({
      id: `ruqyah:${passage.id}:${round}:${ayah.numberInSurah}`,
      kind: "ayah" as const,
      title: `${passage.title} — الآية ${ayah.numberInSurah}`,
      subtitle: "الرقية الشرعية — مشاري العفاسي",
      src: alafasyAyahUrl(ayah.number),
      href: "/ruqyah",
    })),
  ).flat();
}
