import Link from "next/link";
import type { Route } from "next";
import { BrandLogo } from "./BrandLogo";
import { siteFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import type { SiteHeaderNavItem } from "./SiteHeader";
import { defaultSiteHeaderNavItems } from "./SiteHeader";
import "./site-shell.css";

export interface SiteFooterProps {
  navItems?: readonly SiteHeaderNavItem[];
  tagline?: string;
}

/**
 * Site footer: brand + tagline, quick nav, copyright. Feature-agnostic — no `src/features/**`
 * import. Deliberately does not show contact details (address/phone/social links) until a real,
 * owner-confirmed channel exists — inventing placeholder contact info would be misleading.
 */
export function SiteFooter({
  navItems = defaultSiteHeaderNavItems,
  tagline = "معرفة إسلامية موثوقة، وقرآن يرافقك في يومك.",
}: SiteFooterProps) {
  return (
    <footer className={cn("site-footer", siteFontVariables)}>
      <div className="site-footer__grid">
        <div>
          <BrandLogo />
          <p className="site-footer__heading" style={{ marginBlockStart: "var(--ds-space-3)" }}>
            {tagline}
          </p>
        </div>

        <nav aria-label="روابط سريعة">
          <h2 className="site-footer__heading">روابط سريعة</h2>
          <ul className="site-footer__list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href as Route}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} المنارة</span>
      </div>
    </footer>
  );
}
