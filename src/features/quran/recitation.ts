"use client";

import { toArabicDigits } from "@/lib/arabic";
import { toRef, TOTAL_AYAHS } from "@/features/khatma/schedule";
import type { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "./ayahAudio";

type Audio = ReturnType<typeof useAudio>;

const TRACK_PREFIX = "ayah-";

/** The global ayah number (1…6236) an audio track recites, or null for any other track. */
export function ayahFromTrackId(trackId: string | null | undefined): number | null {
  if (!trackId?.startsWith(TRACK_PREFIX)) return null;
  const number = Number(trackId.slice(TRACK_PREFIX.length));
  return Number.isInteger(number) && number >= 1 && number <= TOTAL_AYAHS ? number : null;
}

/**
 * Recites from ayah `number` on, one ayah after another (Husary, murattal), until paused or the end of
 * the mushaf. The reader follows along and turns the page when the recitation reaches the next one.
 */
export function playRecitationFrom(audio: Audio, number: number, surahNames: Record<number, string>) {
  const { surah, ayah } = toRef(number - 1);
  audio.play(
    {
      id: `${TRACK_PREFIX}${number}`,
      kind: "ayah",
      title: `سورة ${surahNames[surah] ?? surah} — الآية ${toArabicDigits(ayah)}`,
      subtitle: "الحصري — مرتّل",
      src: husaryAyahUrl(number),
      href: `/quran/${surah}`,
    },
    { onEnded: () => number < TOTAL_AYAHS && playRecitationFrom(audio, number + 1, surahNames) },
  );
}
