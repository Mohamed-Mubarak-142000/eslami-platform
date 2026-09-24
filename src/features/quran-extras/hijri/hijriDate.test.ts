import { describe, expect, it } from "vitest";
import { daysBetween, getHijriDate, getNextRamadanStart } from "./hijriDate";

describe("getHijriDate", () => {
  it("returns a valid day/month/year and flags Ramadan correctly for a known date", () => {
    // 2025-03-05 is widely published as 5 Ramadan 1446 AH on the Umm al-Qura calendar.
    const hijri = getHijriDate(new Date("2025-03-05T12:00:00Z"));
    expect(hijri.month).toBe(9);
    expect(hijri.isRamadan).toBe(true);
    expect(hijri.year).toBe(1446);
  });

  it("does not flag a non-Ramadan month as Ramadan", () => {
    const hijri = getHijriDate(new Date("2025-01-01T12:00:00Z"));
    expect(hijri.isRamadan).toBe(false);
  });
});

describe("getNextRamadanStart", () => {
  it("finds a future date whose Hijri month is Ramadan day 1", () => {
    const from = new Date("2025-01-01T12:00:00Z");
    const start = getNextRamadanStart(from);
    expect(start).not.toBeNull();
    if (!start) return;
    const hijri = getHijriDate(start);
    expect(hijri.month).toBe(9);
    expect(hijri.day).toBe(1);
    expect(start.getTime()).toBeGreaterThan(from.getTime());
  });
});

describe("daysBetween", () => {
  it("counts whole days between two dates", () => {
    expect(daysBetween(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-11T00:00:00Z"))).toBe(10);
  });
});
