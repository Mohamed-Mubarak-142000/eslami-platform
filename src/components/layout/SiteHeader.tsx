"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { twisterFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./twister-shell.css";

export interface SiteHeaderNavItem {
  href: string;
  label: string;
}

/** CPY-NAV (docs/ux/states-and-microcopy.md): the 6 primary nav destinations, in order. */
export const defaultSiteHeaderNavItems: readonly SiteHeaderNavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/menu", label: "المنيو" },
  { href: "/offers", label: "العروض" },
  { href: "/#zones", label: "المناطق" },
  { href: "/reviews", label: "تقييمات" },
  { href: "/contact", label: "اتصل بنا" },
];

export interface SiteHeaderProps {
  navItems?: readonly SiteHeaderNavItem[];
  /** CPY-CTA-ORDER. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Feature-owned cart trigger/badge — this shell never imports cart logic itself. */
  cartSlot?: ReactNode;
  /** @deprecated legacy Al-Manara prop kept only so existing quran/landing call sites still typecheck. */
  isAuthenticated?: boolean;
}

/**
 * Twister storefront header (LAY-A): brand + 6 nav links + "اطلب الآن" CTA + cart slot, collapsing
 * to a hamburger + full-height RTL drawer under 1024px (docs/ux/information-architecture.md).
 * Feature-agnostic: no `src/features/**` import, driven entirely by props/slots.
 */
export function SiteHeader({ navItems = defaultSiteHeaderNavItems, ctaLabel = "اطلب الآن", ctaHref = "/menu", cartSlot }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={cn("tw-header", twisterFontVariables)}>
      <Link className="tw-header__brand" href="/" aria-label="توستر كريبس آند بيتزا — الرئيسية">
        <BrandLogo />
      </Link>

      <nav className="tw-header__nav" aria-label="التنقل الأساسي">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href as Route} className="tw-header__nav-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="tw-header__actions">
        {cartSlot}
        <Link href={ctaHref as Route} className="tw-header__cta">
          {ctaLabel}
        </Link>
        <button
          type="button"
          className="tw-header__menu-button"
          aria-expanded={menuOpen}
          aria-controls="tw-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          <span className="ds-visually-hidden">{menuOpen ? "إغلاق القائمة" : "فتح القائمة"}</span>
        </button>
      </div>

      {menuOpen && (
        <button type="button" className="tw-header__scrim" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
      )}
      <div
        id="tw-mobile-nav"
        className="tw-header__drawer"
        data-open={menuOpen || undefined}
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقل"
      >
        <nav aria-label="التنقل — نسخة الموبايل">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} className="tw-header__drawer-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        {cartSlot}
        <Link href={ctaHref as Route} className="tw-header__cta tw-header__cta--drawer" onClick={() => setMenuOpen(false)}>
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
