import { describe, expect, it } from "vitest";
import { computeQiblaBearing } from "./qibla";

describe("computeQiblaBearing", () => {
  it("points due south (180°) from directly north of the Kaaba on the same meridian", () => {
    expect(computeQiblaBearing(51.4225, 39.8262)).toBeCloseTo(180, 5);
  });

  it("points due north (0°) from directly south of the Kaaba on the same meridian", () => {
    expect(computeQiblaBearing(-8.5775, 39.8262)).toBeCloseTo(0, 5);
  });

  it("points generally west (270°-360°) from due east of the Kaaba at the same latitude", () => {
    const bearing = computeQiblaBearing(21.4225, 69.8262);
    expect(bearing).toBeGreaterThan(270);
    expect(bearing).toBeLessThan(360);
  });

  it("points generally east (0°-90°) from due west of the Kaaba at the same latitude", () => {
    const bearing = computeQiblaBearing(21.4225, 9.8262);
    expect(bearing).toBeGreaterThan(0);
    expect(bearing).toBeLessThan(90);
  });

  it("always returns a value within [0, 360)", () => {
    const bearing = computeQiblaBearing(30.0444, 31.2357);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});
