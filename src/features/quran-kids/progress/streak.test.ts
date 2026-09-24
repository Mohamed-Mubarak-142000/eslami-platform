import { describe, expect, it } from "vitest";
import { computeStreak, recordActivityDate } from "./streak";

describe("recordActivityDate", () => {
  it("adds today's date once", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const result = recordActivityDate([], now);
    expect(result).toEqual(["2026-03-10"]);
  });

  it("does not duplicate an existing date", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const result = recordActivityDate(["2026-03-10"], now);
    expect(result).toEqual(["2026-03-10"]);
  });
});

describe("computeStreak", () => {
  it("is zero with no activity", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("is zero when the last activity is older than yesterday", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(computeStreak(["2026-03-01"], now)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const dates = ["2026-03-08", "2026-03-09", "2026-03-10"];
    expect(computeStreak(dates, now)).toBe(3);
  });

  it("still counts a streak that ended yesterday (grace period before today's activity)", () => {
    const now = new Date("2026-03-10T08:00:00Z");
    const dates = ["2026-03-08", "2026-03-09"];
    expect(computeStreak(dates, now)).toBe(2);
  });

  it("stops at the first gap", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const dates = ["2026-03-05", "2026-03-09", "2026-03-10"];
    expect(computeStreak(dates, now)).toBe(2);
  });
});
