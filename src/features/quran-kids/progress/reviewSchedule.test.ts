import { describe, expect, it } from "vitest";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";
import { advanceReviewSchedule, getDueReviews, isSurahFullyMemorized, startReviewSchedule } from "./reviewSchedule";

describe("isSurahFullyMemorized", () => {
  it("is false when the surah has no memorized ayahs recorded", () => {
    expect(isSurahFullyMemorized(DEFAULT_KIDS_PROGRESS, 112)).toBe(false);
  });

  it("is true once every ayah of a short surah is memorized (Al-Ikhlas has 4)", () => {
    const state: KidsProgressState = { ...DEFAULT_KIDS_PROGRESS, memorizedAyahsBySurah: { 112: [1, 2, 3, 4] } };
    expect(isSurahFullyMemorized(state, 112)).toBe(true);
  });
});

describe("startReviewSchedule", () => {
  it("schedules the first review one day out at interval index 0", () => {
    const now = new Date("2026-03-10T00:00:00Z");
    const review = startReviewSchedule(now);
    expect(review).toEqual({ intervalIndex: 0, lastReviewedAt: now.toISOString(), dueAt: "2026-03-11T00:00:00.000Z" });
  });
});

describe("advanceReviewSchedule", () => {
  it("moves to the next interval and pushes the due date further out", () => {
    const now = new Date("2026-03-10T00:00:00Z");
    const first = startReviewSchedule(now);
    const later = new Date("2026-03-11T00:00:00Z");
    const second = advanceReviewSchedule(first, later);
    expect(second.intervalIndex).toBe(1);
    expect(second.dueAt).toBe("2026-03-14T00:00:00.000Z");
  });

  it("caps at the last interval instead of growing forever", () => {
    let review = startReviewSchedule(new Date("2026-01-01T00:00:00Z"));
    for (let i = 0; i < 10; i += 1) review = advanceReviewSchedule(review, new Date("2026-01-01T00:00:00Z"));
    expect(review.intervalIndex).toBe(4);
  });
});

describe("getDueReviews", () => {
  it("only returns surahs whose due date has passed, soonest first", () => {
    const now = new Date("2026-03-10T00:00:00Z");
    const schedule = {
      112: { intervalIndex: 0, lastReviewedAt: "", dueAt: "2026-03-09T00:00:00.000Z" },
      113: { intervalIndex: 0, lastReviewedAt: "", dueAt: "2026-03-20T00:00:00.000Z" },
      114: { intervalIndex: 0, lastReviewedAt: "", dueAt: "2026-03-01T00:00:00.000Z" },
    };
    expect(getDueReviews(schedule, now)).toEqual([
      { surahId: 114, dueAt: "2026-03-01T00:00:00.000Z" },
      { surahId: 112, dueAt: "2026-03-09T00:00:00.000Z" },
    ]);
  });
});
