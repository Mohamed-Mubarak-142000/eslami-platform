import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = resolve(process.cwd(), "src/app");
describe("route integration smoke", () => {
  it.each(["page.tsx", "about/page.tsx", "contact/page.tsx", "categories/page.tsx", "content/[id]/page.tsx", "scholars/[slug]/page.tsx", "topics/[slug]/page.tsx", "questions/[id]/page.tsx", "(private)/notifications/page.tsx", "(private)/admin/moderation/page.tsx"])("ships the P0 route %s", route => { expect(readFileSync(resolve(app, route), "utf8").length).toBeGreaterThan(20); });
  it("keeps private question metadata generic and uncached", () => { const source = readFileSync(resolve(app, "(private)/me/questions/[id]/page.tsx"), "utf8"); expect(source).toContain('title: "سؤال خاص"'); expect(source).toContain('dynamic = "force-dynamic"'); expect(source).not.toContain("privateQuestion.title"); expect(source).not.toContain("privateQuestion.details"); });
});
