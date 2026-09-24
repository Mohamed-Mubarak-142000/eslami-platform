import { describe, expect, it } from "vitest";
import type { TajweedAyah } from "@/features/quran";
import { buildTajweedMatchRound, checkTajweedMatch, pickTajweedRound } from "./matchGameLogic";

const ayahWithTwoTargets: TajweedAyah = {
  numberInSurah: 1,
  segments: [
    { text: "بِسْمِ ", ruleClass: null },
    { text: "ٱ", ruleClass: "ham_wasl" },
    { text: "للَّهِ ", ruleClass: null },
    { text: "ن", ruleClass: "ghunnah" },
  ],
};

const ayahWithOneTarget: TajweedAyah = {
  numberInSurah: 2,
  segments: [
    { text: "نص ", ruleClass: null },
    { text: "م", ruleClass: "iqlab" },
  ],
};

describe("buildTajweedMatchRound", () => {
  it("collects every ruled segment into a target, keyed by its position", () => {
    const round = buildTajweedMatchRound(ayahWithTwoTargets);
    expect(round).not.toBeNull();
    expect(round?.targets).toEqual([
      { id: "t-1", text: "ٱ", ruleClass: "ham_wasl" },
      { id: "t-3", text: "ن", ruleClass: "ghunnah" },
    ]);
  });

  it("marks non-ruled segments as non-targets in the display list", () => {
    const round = buildTajweedMatchRound(ayahWithTwoTargets);
    expect(round?.displaySegments[0]).toEqual({ text: "بِسْمِ ", targetId: null });
    expect(round?.displaySegments[1]).toEqual({ text: "ٱ", targetId: "t-1" });
  });

  it("rejects an ayah with fewer than two ruled segments", () => {
    expect(buildTajweedMatchRound(ayahWithOneTarget)).toBeNull();
  });
});

describe("pickTajweedRound", () => {
  it("only picks among ayahs with enough targets to build a round", () => {
    const round = pickTajweedRound([ayahWithOneTarget, ayahWithTwoTargets], () => 0);
    expect(round?.ayahNumberInSurah).toBe(1);
  });

  it("returns null when no ayah has enough targets", () => {
    expect(pickTajweedRound([ayahWithOneTarget], () => 0)).toBeNull();
  });
});

describe("checkTajweedMatch", () => {
  it("matches only when the chosen rule equals the target's rule", () => {
    const target = { id: "t-1", text: "ٱ", ruleClass: "ham_wasl" };
    expect(checkTajweedMatch(target, "ham_wasl")).toBe(true);
    expect(checkTajweedMatch(target, "ghunnah")).toBe(false);
  });
});
