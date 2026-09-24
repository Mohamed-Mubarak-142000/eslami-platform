import { describe, expect, it } from "vitest";
import { formatEgp, formatEgpAmount } from "./format";

describe("formatEgp", () => {
  it("rounds to the nearest pound and appends the currency label", () => {
    expect(formatEgp(110)).toBe("110 ج.م");
    expect(formatEgp(20.4)).toBe("20 ج.م");
  });

  it("adds a thousands separator for large amounts", () => {
    expect(formatEgp(1250)).toBe("1,250 ج.م");
  });
});

describe("formatEgpAmount", () => {
  it("formats without the currency suffix", () => {
    expect(formatEgpAmount(1250)).toBe("1,250");
  });
});
