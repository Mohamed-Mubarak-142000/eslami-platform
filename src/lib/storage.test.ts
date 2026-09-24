import { afterEach, describe, expect, it } from "vitest";
import { localJsonStorage } from "./storage";

afterEach(() => localStorage.clear());

describe("localJsonStorage", () => {
  it("round-trips JSON values", () => {
    localJsonStorage.writeJson("k", { a: 1 });
    expect(localJsonStorage.readJson("k", null)).toEqual({ a: 1 });
  });

  it("returns the fallback when the key is missing", () => {
    expect(localJsonStorage.readJson("missing", "fallback")).toBe("fallback");
  });

  it("returns the fallback instead of throwing on malformed JSON", () => {
    localStorage.setItem("bad", "{not json");
    expect(localJsonStorage.readJson("bad", "fallback")).toBe("fallback");
  });

  it("removes a key", () => {
    localJsonStorage.writeJson("k", 1);
    localJsonStorage.remove("k");
    expect(localJsonStorage.readJson("k", null)).toBeNull();
  });
});
