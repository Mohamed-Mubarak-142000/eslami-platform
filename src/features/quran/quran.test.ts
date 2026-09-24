import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSurahAudioUrl, getKidsReciters, getReciters, getRiwayat, getSurahs, TEACHING_MOSHAF_TYPE, type Reciter } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("quran audio data layer", () => {
  it("builds a zero-padded surah mp3 url from a moshaf server", () => {
    expect(buildSurahAudioUrl("https://server6.mp3quran.net/akdr/", 1)).toBe("https://server6.mp3quran.net/akdr/001.mp3");
    expect(buildSurahAudioUrl("https://server6.mp3quran.net/akdr/", 114)).toBe("https://server6.mp3quran.net/akdr/114.mp3");
  });

  it("parses reciters and their surah_list string into number arrays", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        reciters: [
          {
            id: 1,
            name: "قارئ تجريبي",
            letter: "ق",
            moshaf: [{ id: 1, name: "حفص عن عاصم", rewaya_id: 1, server: "https://server.example/q/", surah_total: 2, moshaf_type: 11, surah_list: "1,2" }],
          },
        ],
      }),
    })) as unknown as typeof fetch);

    const reciters = await getReciters();
    expect(reciters).toEqual([
      { id: 1, name: "قارئ تجريبي", letter: "ق", moshaf: [{ id: 1, name: "حفص عن عاصم", rewayaId: 1, moshafType: 11, server: "https://server.example/q/", surahList: [1, 2] }] },
    ]);
  });

  it("returns an empty list when the reciters request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }) as unknown as typeof fetch);
    await expect(getReciters()).resolves.toEqual([]);
  });

  it("returns an empty list when the suwar request is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })) as unknown as typeof fetch);
    await expect(getSurahs()).resolves.toEqual([]);
  });

  it("marks a surah as meccan only when makkia is 1", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        suwar: [
          { id: 1, name: "الفاتحة", start_page: 1, end_page: 1, makkia: 1, type: 0 },
          { id: 2, name: "البقرة", start_page: 2, end_page: 49, makkia: 0, type: 1 },
        ],
      }),
    })) as unknown as typeof fetch);

    const surahs = await getSurahs();
    expect(surahs).toEqual([
      { id: 1, name: "الفاتحة", meccan: true },
      { id: 2, name: "البقرة", meccan: false },
    ]);
  });

  it("maps riwayat ids to their names", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ riwayat: [{ id: 1, name: "حفص عن عاصم" }, { id: 2, name: "ورش عن نافع" }] }),
    })) as unknown as typeof fetch);

    await expect(getRiwayat()).resolves.toEqual([
      { id: 1, name: "حفص عن عاصم" },
      { id: 2, name: "ورش عن نافع" },
    ]);
  });

  it("keeps only the teaching moshaf for reciters who offer it, and drops reciters who don't", () => {
    const reciters: Reciter[] = [
      {
        id: 1,
        name: "قارئ بمصحف معلم",
        letter: "ق",
        moshaf: [
          { id: 10, name: "حفص عن عاصم - مرتل", rewayaId: 1, moshafType: 11, server: "https://a.example/", surahList: [1, 2] },
          { id: 11, name: "المصحف المعلم", rewayaId: 1, moshafType: TEACHING_MOSHAF_TYPE, server: "https://b.example/", surahList: [1] },
        ],
      },
      {
        id: 2,
        name: "قارئ بدون مصحف معلم",
        letter: "ق",
        moshaf: [{ id: 20, name: "حفص عن عاصم - مرتل", rewayaId: 1, moshafType: 11, server: "https://c.example/", surahList: [1, 2] }],
      },
    ];

    expect(getKidsReciters(reciters)).toEqual([
      {
        id: 1,
        name: "قارئ بمصحف معلم",
        letter: "ق",
        moshaf: [{ id: 11, name: "المصحف المعلم", rewayaId: 1, moshafType: TEACHING_MOSHAF_TYPE, server: "https://b.example/", surahList: [1] }],
      },
    ]);
  });
});
