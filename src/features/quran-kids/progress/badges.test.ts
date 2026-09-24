import { describe, expect, it } from "vitest";
import { BADGE_DEFINITIONS, computeUnlockedBadgeIds } from "./badges";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";

function badge(id: string) {
  const found = BADGE_DEFINITIONS.find((item) => item.id === id);
  if (!found) throw new Error(`missing badge fixture: ${id}`);
  return found;
}

describe("badges", () => {
  it("unlocks no badge for a completely untouched state", () => {
    expect(computeUnlockedBadgeIds(DEFAULT_KIDS_PROGRESS)).toEqual([]);
  });

  it("unlocks first-step as soon as any surah has a memorized ayah", () => {
    const state: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, memorizedAyahsBySurah: { 114: [1] } };
    expect(badge("first-step").isUnlocked(state)).toBe(true);
  });

  it("unlocks first-surah only once a surah's ayah count is fully memorized, not before", () => {
    // Surah 112 (Al-Ikhlas) has 4 ayahs.
    const partial: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, memorizedAyahsBySurah: { 112: [1, 2, 3] } };
    const full: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, memorizedAyahsBySurah: { 112: [1, 2, 3, 4] } };
    expect(badge("first-surah").isUnlocked(partial)).toBe(false);
    expect(badge("first-surah").isUnlocked(full)).toBe(true);
  });

  it("unlocks five-surahs only once five distinct surahs are fully memorized", () => {
    const fourComplete: KidsProgressState = {
      ...DEFAULT_KIDS_PROGRESS,
      memorizedAyahsBySurah: { 114: [1, 2, 3, 4, 5, 6], 113: [1, 2, 3, 4, 5], 112: [1, 2, 3, 4], 111: [1, 2, 3, 4, 5] },
    };
    const fiveComplete: KidsProgressState = {
      ...DEFAULT_KIDS_PROGRESS,
      memorizedAyahsBySurah: { ...fourComplete.memorizedAyahsBySurah, 110: [1, 2, 3] },
    };
    expect(badge("five-surahs").isUnlocked(fourComplete)).toBe(false);
    expect(badge("five-surahs").isUnlocked(fiveComplete)).toBe(true);
  });

  it("unlocks quiz-star only at a perfect score", () => {
    const almost: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, quizStats: { ...DEFAULT_KIDS_PROGRESS.quizStats, bestScorePercent: 99 } };
    const perfect: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, quizStats: { ...DEFAULT_KIDS_PROGRESS.quizStats, bestScorePercent: 100 } };
    expect(badge("quiz-star").isUnlocked(almost)).toBe(false);
    expect(badge("quiz-star").isUnlocked(perfect)).toBe(true);
  });

  it("unlocks tajweed-artist at exactly 3 completed tajweed games", () => {
    const two: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, matchStats: { ...DEFAULT_KIDS_PROGRESS.matchStats, tajweedGamesCompleted: 2 } };
    const three: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, matchStats: { ...DEFAULT_KIDS_PROGRESS.matchStats, tajweedGamesCompleted: 3 } };
    expect(badge("tajweed-artist").isUnlocked(two)).toBe(false);
    expect(badge("tajweed-artist").isUnlocked(three)).toBe(true);
  });

  it("unlocks good-listener at exactly 3 completed surahs", () => {
    const two: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, listenStats: { ...DEFAULT_KIDS_PROGRESS.listenStats, surahsCompleted: [114, 113] } };
    const three: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, listenStats: { ...DEFAULT_KIDS_PROGRESS.listenStats, surahsCompleted: [114, 113, 112] } };
    expect(badge("good-listener").isUnlocked(two)).toBe(false);
    expect(badge("good-listener").isUnlocked(three)).toBe(true);
  });
});
