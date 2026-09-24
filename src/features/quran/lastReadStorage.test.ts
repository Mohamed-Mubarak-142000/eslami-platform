import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLastRead, saveLastRead } from "./lastReadStorage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadLastRead", () => {
  it("returns null when nothing was saved", () => {
    expect(loadLastRead()).toBeNull();
  });

  it("returns null when the stored value is not valid JSON", () => {
    window.localStorage.setItem("al-manara:quran-last-read:v1", "{not json");
    expect(loadLastRead()).toBeNull();
  });

  it("round-trips a saved surah", () => {
    saveLastRead(36, "يس");
    const result = loadLastRead();
    expect(result?.surahId).toBe(36);
    expect(result?.surahName).toBe("يس");
  });

  it("overwrites the previous entry on a new save", () => {
    saveLastRead(36, "يس");
    saveLastRead(2, "البقرة");
    expect(loadLastRead()?.surahId).toBe(2);
  });
});

describe("saveLastRead", () => {
  it("does not throw when localStorage.setItem fails", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveLastRead(1, "الفاتحة")).not.toThrow();
  });
});
