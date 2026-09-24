import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { publicContent, scholarProfile } from "@/mocks";
import { LoginForm, RegisterForm } from "./auth/AuthFeatures";
import { Feed, ContentCard, ContentDetail } from "./content/ContentFeatures";

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
});
