import type { KidsProgressState } from "./progressTypes";

/** A single friendly "stars" total for the garden: every learning action earns some. */
export function computeStars(state: KidsProgressState): number {
  const memorized = Object.values(state.memorizedAyahsBySurah).reduce((sum, ayahs) => sum + ayahs.length, 0);
  return (
    memorized * 2 +
    state.quizStats.totalCorrect +
    (state.matchStats.letterGamesCompleted + state.matchStats.tajweedGamesCompleted) * 3 +
    state.listenStats.surahsCompleted.length * 5
  );
}

export function countMemorizedAyahs(state: KidsProgressState): number {
  return Object.values(state.memorizedAyahsBySurah).reduce((sum, ayahs) => sum + ayahs.length, 0);
}
