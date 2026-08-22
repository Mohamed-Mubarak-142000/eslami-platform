import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { can, canReadQuestion, type Account, type Question, type Session } from "@/domain";
import { ModerationQueue, ReviewDecision } from "@/features/admin/AdminFeatures";
import { AnswerEditor } from "@/features/questions/QuestionFeatures";

afterEach(cleanup);

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

const reviewCase = {
  id: "case-1",
  status: "new",
  priority: "normal",
  kind: "content" as const,
  ageLabel: "one day",
  version: 3,
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

  it("allows an in-specialty verified scholar to complete the answer action", () => {
    const submit = vi.fn();
    expect(can(account("verified_scholar"), "answer", { specialtyMatches: true })).toBe(true);
    render(<AnswerEditor permission onSubmit={submit} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "answer with a structured source" } });
    fireEvent.click(screen.getByRole("button"));
    expect(submit).toHaveBeenCalledWith("answer with a structured source");
  });

  it("allows a moderator to open the moderation queue", () => {
    expect(can(account("moderator"), "moderate")).toBe(true);
    render(<ModerationQueue cases={[reviewCase]} canModerate />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("requires an admin decision reason and forwards the record version", () => {
    const decide = vi.fn();
    expect(can(account("admin"), "manage_verification")).toBe(true);
    render(<ReviewDecision reviewCase={{ ...reviewCase, kind: "verification" }} onDecision={decide} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "evidence reviewed" } });
    fireEvent.click(button);
    expect(decide).toHaveBeenCalledWith("approve", "evidence reviewed", 3);
  });
});
