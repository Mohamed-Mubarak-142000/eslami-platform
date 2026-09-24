import { afterEach, describe, expect, it, vi } from "vitest";
import { BASMALA, getSurahAyahs, getSurahTafsir } from "./textApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockAyahsResponse(ayahs: { number: number; numberInSurah: number; text: string }[]) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ data: { ayahs } }),
  })) as unknown as typeof fetch);
}

describe("quran text data layer", () => {
  it("separates the basmala from a regular surah's first ayah", async () => {
    mockAyahsResponse([
      { number: 8, numberInSurah: 1, text: `${BASMALA} الٓمٓ` },
      { number: 9, numberInSurah: 2, text: "ذَٰلِكَ ٱلْكِتَٰبُ" },
    ]);

    const result = await getSurahAyahs(2);
    expect(result.basmala).toBe(BASMALA);
    expect(result.ayahs).toEqual([
      { number: 8, numberInSurah: 1, text: "الٓمٓ" },
      { number: 9, numberInSurah: 2, text: "ذَٰلِكَ ٱلْكِتَٰبُ" },
    ]);
  });

  it("does not split a basmala out of At-Tawbah (surah 9), which has none", async () => {
    mockAyahsResponse([{ number: 1235, numberInSurah: 1, text: "بَرَآءَةٌۭ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ" }]);

    const result = await getSurahAyahs(9);
    expect(result.basmala).toBeNull();
    expect(result.ayahs).toEqual([{ number: 1235, numberInSurah: 1, text: "بَرَآءَةٌۭ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ" }]);
  });

  it("does not split Al-Fatiha's first ayah, since it is the basmala itself", async () => {
    mockAyahsResponse([{ number: 1, numberInSurah: 1, text: BASMALA }]);

    const result = await getSurahAyahs(1);
    expect(result.basmala).toBeNull();
    expect(result.ayahs).toEqual([{ number: 1, numberInSurah: 1, text: BASMALA }]);
  });

  it("strips a leading BOM character from ayah text", async () => {
    mockAyahsResponse([{ number: 1, numberInSurah: 1, text: `﻿${BASMALA}` }]);

    const result = await getSurahAyahs(1);
    expect(result.ayahs[0]?.text).toBe(BASMALA);
  });

  it("returns an empty result when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch);
    await expect(getSurahAyahs(2)).resolves.toEqual({ basmala: null, ayahs: [] });
  });

  it("returns an empty result when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })) as unknown as typeof fetch);
    await expect(getSurahAyahs(2)).resolves.toEqual({ basmala: null, ayahs: [] });
  });
});

describe("getSurahTafsir", () => {
  it("maps the Al-Muyassar edition's ayahs to numberInSurah + text", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { ayahs: [{ number: 1, numberInSurah: 1, text: "تفسير الآية الأولى" }] } }),
    })) as unknown as typeof fetch);

    await expect(getSurahTafsir(1)).resolves.toEqual([{ numberInSurah: 1, text: "تفسير الآية الأولى" }]);
  });

  it("returns an empty list when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch);
    await expect(getSurahTafsir(1)).resolves.toEqual([]);
  });
});
