import { afterEach, describe, expect, it, vi } from "vitest";
import { getSurahTajweedAyahs, parseTajweedMarkup, TAJWEED_RULES } from "./tajweedApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tajweed markup parser", () => {
  it("splits plain text and tajweed-tagged rule spans, dropping the ayah-end marker", () => {
    const markup = "بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <span class=end>١</span>";
    expect(parseTajweedMarkup(markup)).toEqual([
      { text: "بِسْمِ ", ruleClass: null },
      { text: "ٱ", ruleClass: "ham_wasl" },
      { text: "للَّهِ ", ruleClass: null },
    ]);
  });

  it("returns a single plain-text segment when there is no markup at all", () => {
    expect(parseTajweedMarkup("نص بلا أحكام")).toEqual([{ text: "نص بلا أحكام", ruleClass: null }]);
  });

  it("every rule class known to the parser's real-world data has a legend entry", () => {
    for (const key of ["ghunnah", "ikhafa", "iqlab", "qalaqah", "madda_normal", "laam_shamsiyah"]) {
      expect(TAJWEED_RULES[key]).toBeDefined();
    }
  });
});

describe("getSurahTajweedAyahs", () => {
  it("derives numberInSurah from the verse_key and parses each verse's markup", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        verses: [
          { id: 1, verse_key: "2:1", text_uthmani_tajweed: "ا<tajweed class=madda_necessary>لٓ</tajweed> <span class=end>١</span>" },
        ],
      }),
    })) as unknown as typeof fetch);

    const ayahs = await getSurahTajweedAyahs(2);
    expect(ayahs).toEqual([
      {
        numberInSurah: 1,
        segments: [
          { text: "ا", ruleClass: null },
          { text: "لٓ", ruleClass: "madda_necessary" },
          { text: " ", ruleClass: null },
        ],
      },
    ]);
  });

  it("returns an empty list when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch);
    await expect(getSurahTajweedAyahs(2)).resolves.toEqual([]);
  });

  it("returns an empty list when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })) as unknown as typeof fetch);
    await expect(getSurahTajweedAyahs(2)).resolves.toEqual([]);
  });
});
