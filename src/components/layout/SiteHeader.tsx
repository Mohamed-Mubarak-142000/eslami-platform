"use client";

import Link from "next/link";
import type { Route } from "next";
import { BookOpenCheck, Home, Menu, Radio, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import "@/features/landing/landing.css";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/#radio", label: "إذاعة القرآن", icon: Radio },
  { href: "/quran", label: "القرآن الكريم", icon: BookOpenCheck },
];

export function SiteHeader({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryHref = (isAuthenticated ? "/quran" : "/register") as Route;

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
    <header className="landing-header">
      <Link className="landing-brand" href="/" aria-label="المنارة — الرئيسية">
        <BrandLogo priority />
      </Link>
      <button className="landing-menu" type="button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />} <span className="sr-only">{menuOpen ? "إغلاق القائمة" : "فتح القائمة"}</span>
      </button>
      <nav id="site-nav" className="landing-nav" data-open={menuOpen || undefined} aria-label="التنقل العام">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href as Route} onClick={() => setMenuOpen(false)}><Icon aria-hidden /> {label}</Link>
        ))}
        <div className="landing-nav__actions">
          {!isAuthenticated && <Link className="landing-button landing-button--ghost" href="/login" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>}
          <Link className="landing-button" href={primaryHref} onClick={() => setMenuOpen(false)}>{isAuthenticated ? "استمع للقرآن" : "أنشئ حسابًا"}</Link>
        </div>
      </nav>
      <div className="landing-header__actions">
        {!isAuthenticated && <Link className="landing-button landing-button--ghost" href="/login">تسجيل الدخول</Link>}
        <Link className="landing-button" href={primaryHref}>{isAuthenticated ? "استمع للقرآن" : "أنشئ حسابًا"}</Link>
      </div>
    </header>
  );
}
