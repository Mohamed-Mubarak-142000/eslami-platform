import { describe, expect, it } from "vitest";
import { can, canReadQuestion } from "@/domain";
import { member, memberSession, privateQuestion, scholar } from "@/mocks";
import { assertNoSensitiveTelemetry } from "./analytics";
import { mapHttpError } from "./errors";

describe("foundation contracts", () => {
  it("enforces account status and scholar specialty", () => { expect(can(member, "answer", { specialtyMatches: true })).toBe(false); expect(can(scholar, "answer", { specialtyMatches: true })).toBe(true); expect(can({ ...scholar, status: "suspended" }, "answer", { specialtyMatches: true })).toBe(false); });
  it("keeps private questions owner-scoped", () => { expect(canReadQuestion(memberSession, privateQuestion)).toBe(true); expect(canReadQuestion({ account: { ...member, id: "other" }, expiresAt: null }, privateQuestion)).toBe(false); });
  it("maps optimistic concurrency conflicts", () => expect(mapHttpError(409).kind).toBe("conflict"));
  it("rejects sensitive analytics payloads", () => expect(() => assertNoSensitiveTelemetry({ body: "private" })).toThrow());
});
