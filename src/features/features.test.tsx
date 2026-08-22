import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { publicContent, scholarProfile } from "@/mocks";
import { LoginForm, RegisterForm } from "./auth/AuthFeatures";
import { Feed, ContentCard, ContentDetail } from "./content/ContentFeatures";
import { AskQuestion, QuestionDetail } from "./questions/QuestionFeatures";
import { Notifications } from "./notifications/NotificationFeatures";
import { ModerationQueue, ReviewDecision } from "./admin/AdminFeatures";

afterEach(cleanup);

describe("P0 feature surfaces", () => {
  it("validates login without exposing credential details", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
    expect(screen.getAllByText("أدخل بريدًا إلكترونيًا صالحًا.")).not.toHaveLength(0);
    expect(screen.getAllByText("أدخل كلمة المرور.")).not.toHaveLength(0);
  });

  it("supports password visibility and complete registration validation", () => {
    render(<LoginForm />);
    const password = screen.getByLabelText("كلمة المرور");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "إظهار كلمة المرور" }));
    expect(password).toHaveAttribute("type", "text");
    cleanup();
    render(<RegisterForm />);
    fireEvent.click(screen.getByRole("button", { name: "إنشاء حساب عضو" }));
    expect(screen.getAllByText("الموافقة على الشروط وسياسة الخصوصية مطلوبة.")).not.toHaveLength(0);
  });

  it("toggles helpful, save, and a structured comment surface", () => {
    render(<ContentCard content={publicContent} />);
    const helpful = screen.getByRole("button", { name: /مفيد/ });
    fireEvent.click(helpful);
    expect(helpful).toHaveAttribute("aria-pressed", "true");
    const save = screen.getByRole("button", { name: "حفظ" });
    fireEvent.click(save);
    expect(screen.getByRole("button", { name: "محفوظ" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "تعقيب" }));
    expect(screen.getByLabelText("التعقيبات")).toBeInTheDocument();
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
