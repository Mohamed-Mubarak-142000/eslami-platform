import { describe, expect, it } from "vitest";
import { heroTimelineSteps } from "./twister";

describe("heroTimelineSteps", () => {
  it("matches motion-choreography.md's beat order and timings", () => {
    expect(heroTimelineSteps.map((step) => step.id)).toEqual(["curtain", "logo-reveal", "headline", "food-spotlight", "cta-and-badge"]);
    for (let i = 1; i < heroTimelineSteps.length; i += 1) {
      expect(heroTimelineSteps[i]!.startSeconds).toBeGreaterThanOrEqual(heroTimelineSteps[i - 1]!.startSeconds);
    }
  });
});
