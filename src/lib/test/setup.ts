import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

/**
 * `next/font/google` only works through Next's own compiler transform; outside a real Next
 * build (e.g. here, under Vitest) the imported names are not callable. Every test run gets a
 * deterministic stand-in so `src/lib/fonts.ts` (and anything importing it) can be rendered in
 * plain Vitest/RTL tests without needing the real Next.js build pipeline.
 */
vi.mock("next/font/google", () => {
  const load = (variable: string) => () => ({ variable, className: variable.replace("--", "").replace(/-/g, "_") });
  return { Cairo: load("--font-cairo"), Alexandria: load("--font-alexandria") };
});
