import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { publicContent, scholarProfile } from "@/mocks";
import { LoginForm } from "./auth/AuthFeatures";
import { Feed, ContentDetail } from "./content/ContentFeatures";
import { AskQuestion, QuestionDetail } from "./questions/QuestionFeatures";
import { Notifications } from "./notifications/NotificationFeatures";
import { ModerationQueue, ReviewDecision } from "./admin/AdminFeatures";

afterEach(cleanup);

describe("P0 feature surfaces", () => {
  it("validates login without exposing credential details", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "دخول" }));
    expect(screen.getByRole("alert")).toHaveTextContent("راجع الحقول");
  });

  it("renders content with its scholar and source", () => {
    render(<ContentDetail content={publicContent} author={scholarProfile} />);
    expect(screen.getByRole("heading", { name: publicContent.title })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "المصدر 1" })).toBeInTheDocument();
  });

  it("presents deterministic empty and offline states", () => {
    const { rerender } = render(<Feed items={[]} />);
    expect(screen.getByText("لا يوجد محتوى هنا بعد.")).toBeInTheDocument();
    rerender(<Feed items={[]} status="offline" />);
    expect(screen.getByText(/لا يوجد اتصال بالإنترنت/)).toBeInTheDocument();
  });

  it("submits private question with privacy warning", () => {
    const submit = vi.fn();
    render(<AskQuestion onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("عنوان السؤال"), { target: { value: "عنوان" } });
    fireEvent.change(screen.getByLabelText("التفاصيل"), { target: { value: "تفاصيل" } });
    fireEvent.change(screen.getByLabelText("التخصص"), { target: { value: "sp-fiqh" } });
    fireEvent.click(screen.getByLabelText("خاص"));
    expect(screen.getByText(/لن يظهر في البحث أو المشاركة/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إرسال السؤال للمراجعة" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ visibility: "private" }));
  });

  it("does not disclose a private question to an unauthorized viewer", () => {
    render(<QuestionDetail question={{ id: "q", ownerId: "a", title: "سري", details: "بيانات سرية", visibility: "private", status: "routed", specialtyId: "sp", version: 1 }} privateAccess={false} />);
    expect(screen.queryByText("بيانات سرية")).not.toBeInTheDocument();
    expect(screen.getByText(/تعذر العثور على الصفحة/)).toBeInTheDocument();
  });

  it("redacts sensitive notification previews", () => {
    render(<Notifications items={[{ id: "n", title: "نص خاص", occurredAt: "2026-08-22", unread: true, sensitive: true }]} />);
    expect(screen.queryByText("نص خاص")).not.toBeInTheDocument();
    expect(screen.getByText("لديك تحديث على عنصر خاص")).toBeInTheDocument();
  });

  it("enforces moderation permission and decision reason", () => {
    const item = { id: "r", status: "new", priority: "normal", kind: "content" as const, ageLabel: "يوم", version: 2 };
    const { rerender } = render(<ModerationQueue cases={[item]} canModerate={false} />);
    expect(screen.getByText(/لا تملك صلاحية/)).toBeInTheDocument();
    rerender(<ReviewDecision reviewCase={item} />);
    expect(screen.getByRole("button", { name: "اعتماد القرار" })).toBeDisabled();
  });
});
