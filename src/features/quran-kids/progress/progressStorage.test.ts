import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";
import { loadKidsProgress, saveKidsProgress } from "./progressStorage";

const STORAGE_KEY = "al-manara:kids-progress:v1";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadKidsProgress", () => {
  it("returns the default state when nothing is stored", () => {
    expect(loadKidsProgress()).toEqual(DEFAULT_KIDS_PROGRESS);
  });

  it("returns the default state when the stored value is not valid JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadKidsProgress()).toEqual(DEFAULT_KIDS_PROGRESS);
  });

  it("returns the default state when the stored value does not match the schema", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, foo: "bar" }));
    expect(loadKidsProgress()).toEqual(DEFAULT_KIDS_PROGRESS);
  });

  it("round-trips a valid state saved earlier", () => {
    const state: KidsProgressState = {
      ...DEFAULT_KIDS_PROGRESS,
      memorizedAyahsBySurah: { 114: [1, 2, 3] },
      unlockedBadgeIds: ["first-step"],
    };
    saveKidsProgress(state);
    expect(loadKidsProgress()).toEqual(state);
  });
});

describe("saveKidsProgress", () => {
  it("does not throw when localStorage.setItem fails (e.g. quota exceeded)", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveKidsProgress(DEFAULT_KIDS_PROGRESS)).not.toThrow();
  });
});
