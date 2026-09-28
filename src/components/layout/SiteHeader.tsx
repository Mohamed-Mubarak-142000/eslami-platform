"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { siteFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./site-shell.css";

export interface SiteHeaderNavItem {
  href: string;
  label: string;
}

/** The primary nav destinations, in order. Pages may override via the `navItems` prop. */
export const defaultSiteHeaderNavItems: readonly SiteHeaderNavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/quran", label: "القرآن الكريم" },
  { href: "/quran/kids", label: "تعليم الأطفال" },
  { href: "/quran/more", label: "الأدعية ومواقيت الصلاة" },
];

export interface SiteHeaderProps {
  navItems?: readonly SiteHeaderNavItem[];
  /** CPY-CTA-ORDER. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional trigger/badge slot owned by the caller — this shell never imports feature logic itself. */
  cartSlot?: ReactNode;
  /** Reserved for a future signed-in variant of the header; currently unused by the shell itself. */
  isAuthenticated?: boolean;
}

/**
 * Site header: brand + nav links + a single CTA, collapsing to a hamburger + full-height RTL
 * drawer under 1024px. Feature-agnostic: no `src/features/**` import, driven entirely by
 * props/slots.
 */
export function SiteHeader({
  navItems = defaultSiteHeaderNavItems,
  ctaLabel = "ابدأ التعلّم",
  ctaHref = "/quran",
  cartSlot,
}: SiteHeaderProps) {
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
    <header className={cn("site-header", siteFontVariables)}>
      <Link className="site-header__brand" href="/" aria-label="المنارة — الرئيسية">
        <BrandLogo />
      </Link>

      <nav className="site-header__nav" aria-label="التنقل الأساسي">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href as Route} className="site-header__nav-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="site-header__actions">
        {cartSlot}
        <Link href={ctaHref as Route} className="site-header__cta">
          {ctaLabel}
        </Link>
        <button
          type="button"
          className="site-header__menu-button"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          <span className="ds-visually-hidden">{menuOpen ? "إغلاق القائمة" : "فتح القائمة"}</span>
        </button>
      </div>

      {menuOpen && (
        <button type="button" className="site-header__scrim" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
      )}
      <div
        id="site-mobile-nav"
        className="site-header__drawer"
        data-open={menuOpen || undefined}
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقل"
      >
        <nav aria-label="التنقل — نسخة الموبايل">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} className="site-header__drawer-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        {cartSlot}
        <Link href={ctaHref as Route} className="site-header__cta site-header__cta--drawer" onClick={() => setMenuOpen(false)}>
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
