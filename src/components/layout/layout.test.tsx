import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminShell } from "./AdminShell";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader, defaultSiteHeaderNavItems } from "./SiteHeader";
import { StickyWhatsAppButton } from "./StickyWhatsAppButton";

afterEach(cleanup);

describe("SiteHeader", () => {
  it("renders the 6 primary nav items plus the order CTA", () => {
    render(<SiteHeader />);
    for (const item of defaultSiteHeaderNavItems) expect(screen.getAllByRole("link", { name: item.label }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "اطلب الآن" }).length).toBeGreaterThan(0);
  });

  it("opens and closes the mobile drawer", () => {
    render(<SiteHeader />);
    const toggle = screen.getByRole("button", { name: "فتح القائمة" });
    fireEvent.click(toggle);
    expect(screen.getByRole("dialog", { name: "قائمة التنقل" })).toHaveAttribute("data-open");
    fireEvent.click(screen.getByRole("button", { name: "إغلاق القائمة" }));
    expect(screen.getByRole("dialog", { name: "قائمة التنقل" })).not.toHaveAttribute("data-open");
  });

  it("renders a provided cartSlot", () => {
    render(<SiteHeader cartSlot={<span data-testid="cart-slot">2</span>} />);
    expect(screen.getAllByTestId("cart-slot").length).toBeGreaterThan(0);
  });

  it("still accepts the deprecated legacy isAuthenticated prop without error", () => {
    expect(() => render(<SiteHeader isAuthenticated />)).not.toThrow();
  });
});

describe("SiteFooter", () => {
  it("links WhatsApp with the given number and shows the placeholder-data badge by default", () => {
    render(<SiteFooter whatsappNumber="201000000000" />);
    expect(screen.getByRole("link", { name: /تواصل عبر واتساب/ })).toHaveAttribute("href", "https://wa.me/201000000000");
    expect(screen.getByText("بيانات توضيحية — لسه مش نهائية")).toBeInTheDocument();
  });

  it("hides the placeholder badge once business info is verified", () => {
    render(<SiteFooter isBusinessInfoVerified />);
    expect(screen.queryByText("بيانات توضيحية — لسه مش نهائية")).not.toBeInTheDocument();
  });
});

describe("StickyWhatsAppButton", () => {
  it("builds a plain wa.me link with no message", () => {
    render(<StickyWhatsAppButton whatsappNumber="201000000000" />);
    expect(screen.getByRole("link", { name: "تواصل معنا عبر واتساب" })).toHaveAttribute("href", "https://wa.me/201000000000");
  });

  it("encodes an optional prefilled message", () => {
    render(<StickyWhatsAppButton whatsappNumber="201000000000" message="مرحبا" />);
    expect(screen.getByRole("link", { name: "تواصل معنا عبر واتساب" })).toHaveAttribute(
      "href",
      `https://wa.me/201000000000?text=${encodeURIComponent("مرحبا")}`,
    );
  });
});

describe("AdminShell", () => {
  it("renders exactly one <main> landmark and the persistent local-data notice", () => {
    render(
      <AdminShell activeHref="/admin/products" title="المنتجات">
        <p>محتوى الصفحة</p>
      </AdminShell>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByText("الأرقام والطلبات هنا محلية على هذا المتصفح فقط، مش قاعدة بيانات مركزية")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "المنتجات" })[0]).toHaveAttribute("aria-current", "page");
  });
});
