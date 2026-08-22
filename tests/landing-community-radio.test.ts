import { describe, expect, it } from "vitest";
import { isAuthenticatedSession } from "@/integrations";
import { guestSession, memberSession } from "@/mocks";

describe("community session authorization", () => {
  it("accepts an active member with an unexpired session", () => {
    expect(isAuthenticatedSession(memberSession, Date.parse("2026-08-22T00:00:00.000Z"))).toBe(true);
  });

  it("rejects guests, expired sessions, and inactive accounts", () => {
    expect(isAuthenticatedSession(guestSession)).toBe(false);
    expect(isAuthenticatedSession({ ...memberSession, expiresAt: "2020-01-01T00:00:00.000Z" })).toBe(false);
    expect(isAuthenticatedSession({
      ...memberSession,
      account: memberSession.account && { ...memberSession.account, status: "suspended" },
    })).toBe(false);
  });
});
