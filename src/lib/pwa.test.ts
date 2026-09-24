import { describe, expect, it } from "vitest";
import { isStandaloneDisplayMode, registerServiceWorker } from "./pwa";

describe("registerServiceWorker", () => {
  it("resolves without registering when the browser has no serviceWorker API", async () => {
    expect(await registerServiceWorker()).toEqual({ registered: false });
  });
});

describe("isStandaloneDisplayMode", () => {
  it("returns false when matchMedia reports the standalone query as unmatched", () => {
    expect(isStandaloneDisplayMode()).toBe(false);
  });
});
