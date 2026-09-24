import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = resolve(process.cwd(), "src/app");
describe("route integration smoke", () => {
  it.each([
    "page.tsx",
    "quran/page.tsx",
    "quran/[reciterId]/page.tsx",
    "quran/kids/page.tsx",
    "quran/kids/audio/page.tsx",
    "quran/kids/audio/[reciterId]/page.tsx",
    "quran/kids/match/page.tsx",
    "quran/kids/match/letters/page.tsx",
    "quran/kids/match/[surahNumber]/page.tsx",
    "quran/kids/listen/page.tsx",
    "quran/kids/listen/[surahNumber]/page.tsx",
    "quran/kids/quiz/page.tsx",
    "quran/kids/progress/page.tsx",
    "quran/kids/progress/[surahNumber]/page.tsx",
    "quran/read/page.tsx",
    "quran/read/[surahNumber]/page.tsx",
  ])("ships the P0 route %s", route => { expect(readFileSync(resolve(app, route), "utf8").length).toBeGreaterThan(20); });
});
