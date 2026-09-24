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
    "quran/kids/[reciterId]/page.tsx",
    "quran/read/page.tsx",
    "quran/read/[surahNumber]/page.tsx",
  ])("ships the P0 route %s", route => { expect(readFileSync(resolve(app, route), "utf8").length).toBeGreaterThan(20); });
});
