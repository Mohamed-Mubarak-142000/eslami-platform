import { describe, expect, it } from "vitest";
import { toQuestion } from "./adapters";
import { trackSafe } from "./services";
describe("integration privacy contracts", () => {
  it("adapts optional assignment without widening the domain", () => { expect(toQuestion({ id: "q", owner_id: "o", title: "t", details: "d", visibility: "private", status: "draft", specialty_id: "s", version: 1 })).not.toHaveProperty("assignedScholarId"); });
  it("rejects sensitive analytics fields", () => { expect(() => trackSafe({ name: "action_failed", properties: { action: "submit", errorCode: 'details' } })).toThrow("Sensitive telemetry field rejected"); });
});
