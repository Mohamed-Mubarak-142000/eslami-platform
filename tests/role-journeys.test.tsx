import { describe, expect, it } from "vitest";
import { can, canReadQuestion, type Account, type Question, type Session } from "@/domain";

const account = (role: Account["roles"][number]): Account => ({
  id: `account-${role}`,
  displayName: role,
  roles: [role],
  status: "active",
});

const privateQuestion: Question = {
  id: "private-question",
  ownerId: "owner",
  title: "private",
  details: "private details",
  visibility: "private",
  status: "routed",
  specialtyId: "fiqh",
  version: 1,
  assignedScholarId: "account-verified_scholar",
};

describe("P0 role journeys and permission contracts", () => {
  it("allows only the owner, assigned scholar, moderator, or admin to read a private question", () => {
    const session = (role: Account["roles"][number]): Session => ({ account: account(role), expiresAt: null });
    expect(canReadQuestion({ account: account("member"), expiresAt: null }, privateQuestion)).toBe(false);
    expect(canReadQuestion({ account: { ...account("member"), id: "owner" }, expiresAt: null }, privateQuestion)).toBe(true);
    expect(canReadQuestion(session("verified_scholar"), privateQuestion)).toBe(true);
    expect(canReadQuestion(session("moderator"), privateQuestion)).toBe(true);
    expect(canReadQuestion(session("admin"), privateQuestion)).toBe(true);
  });

  it("grants answer, moderate, and verification permissions to the matching roles", () => {
    expect(can(account("verified_scholar"), "answer", { specialtyMatches: true })).toBe(true);
    expect(can(account("moderator"), "moderate")).toBe(true);
    expect(can(account("admin"), "manage_verification")).toBe(true);
  });
});
