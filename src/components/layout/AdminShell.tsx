import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { siteFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./site-shell.css";

export interface AdminNavItem {
  href: string;
  label: string;
}

/**
 * No `/admin/**` sections are built yet — callers should pass their own `navItems` once real
 * admin routes (courses/lessons/articles CRUD, etc.) are scoped and shipped.
 */
export const defaultAdminNavItems: readonly AdminNavItem[] = [{ href: "/admin", label: "لوحة القيادة" }];

export interface AdminShellProps {
  children: ReactNode;
  navItems?: readonly AdminNavItem[];
  /**
   * The current admin route, for nav highlighting. Passed explicitly by the composing page
   * (e.g. from its own route segment) rather than read via `usePathname` here, so this shell
   * stays a plain Server Component and is trivial to render in Storybook/tests without a router.
   */
  activeHref?: string;
  topbarSlot?: ReactNode;
  title?: string;
}

function isActive(active: string, href: string): boolean {
  return active === href || active.startsWith(`${href}/`);
}

/**
 * Local-sandbox admin console shell (LAY-C, admin-requirements.md). Renders exactly one <main>
 * landmark for the whole composed tree — nav/topbar/notice chrome live outside it — so nesting
 * this around any admin page never produces a second <main> (resolves the stale QA defect
 * `20260822-qa-to-foundation-admin-main-landmark.md` by construction).
 * Feature-agnostic: no `src/features/**` import; pages/resources are composed via `children`.
 */
export function AdminShell({ children, navItems = defaultAdminNavItems, activeHref = "", topbarSlot, title }: AdminShellProps) {
  return (
    <div className={cn("site-admin-shell", siteFontVariables)}>
      {/* CPY-ADMIN-LOCAL-NOTICE — persistent, never dismissible (docs/ux/wireframes.md SCR-021). */}
      <p className="site-admin-shell__notice" role="note">
        البيانات هنا محلية على هذا المتصفح فقط، مش قاعدة بيانات مركزية
      </p>

      <header className="site-admin-shell__topbar">
        <Link href={"/admin" as Route} aria-label="لوحة تحكم المنارة">
          <BrandLogo showName={false} />
        </Link>
        {title && <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-lg)", color: "var(--ds-color-text)" }}>{title}</h1>}
        {topbarSlot && <div style={{ marginInlineStart: "auto" }}>{topbarSlot}</div>}
      </header>

      <div className="site-admin-shell__body">
        <nav className="site-admin-shell__nav" aria-label="تنقل لوحة التحكم">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} aria-current={isActive(activeHref, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="site-admin-shell__main">{children}</main>
      </div>

      <nav className="site-admin-shell__bottom-tabs" aria-label="تنقل لوحة التحكم — نسخة الموبايل">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href as Route} aria-current={isActive(activeHref, item.href) ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
