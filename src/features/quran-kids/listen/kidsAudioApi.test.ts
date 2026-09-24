import { describe, expect, it } from "vitest";
import { buildAyahAudioUrl } from "./kidsAudioApi";

describe("buildAyahAudioUrl", () => {
  it("builds a per-ayah audio url from the global ayah number", () => {
    expect(buildAyahAudioUrl(1)).toBe("https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3");
    expect(buildAyahAudioUrl(6236)).toBe("https://cdn.islamic.network/quran/audio/128/ar.alafasy/6236.mp3");
  });
});
