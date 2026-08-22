import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("composes conditional classes", () => expect(cn("text-sm", false && "hidden", { flex: true })).toBe("text-sm flex"));
  it("resolves conflicting semantic utilities", () => expect(cn("bg-card", "bg-primary")).toBe("bg-primary"));
});
