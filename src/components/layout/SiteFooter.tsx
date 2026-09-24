import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { twisterFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import type { SiteHeaderNavItem } from "./SiteHeader";
import { defaultSiteHeaderNavItems } from "./SiteHeader";
import "./twister-shell.css";

export interface SiteFooterProps {
  navItems?: readonly SiteHeaderNavItem[];
  /** E.164-ish digits only (no "+"), matching `NEXT_PUBLIC_WHATSAPP_NUMBER` (whatsapp-order-message.md). */
  whatsappNumber?: string;
  address?: string;
  /** business-facts.md: real hours are a placeholder until the owner confirms them. */
  hoursLabel?: string;
  /** Shown whenever the underlying business data is not yet owner-confirmed (business-facts.md). */
  isBusinessInfoVerified?: boolean;
}

const defaultWhatsappNumber = "201233326848";

/**
 * Twister storefront footer: quick nav, WhatsApp contact, placeholder-aware business info.
 * Feature-agnostic — no `src/features/**` import; social links are omitted entirely rather than
 * pointing at "#" when no real profile exists (business-facts.md).
 */
export function SiteFooter({
  navItems = defaultSiteHeaderNavItems,
  whatsappNumber = defaultWhatsappNumber,
  address = "القاهرة، مصر — العنوان الكامل قريبًا",
  hoursLabel = "يوميًا 1 ظهرًا – 2 فجرًا",
  isBusinessInfoVerified = false,
}: SiteFooterProps) {
  const whatsappHref = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className={cn("tw-footer", twisterFontVariables)}>
      <div className="tw-footer__grid">
        <div>
          <BrandLogo />
          <p className="tw-footer__heading" style={{ marginBlockStart: "var(--ds-space-3)" }}>
            بيتزا وكريب وبرجر — اطلب واستلم عبر واتساب.
          </p>
        </div>

        <nav aria-label="روابط سريعة">
          <h2 className="tw-footer__heading">روابط سريعة</h2>
          <ul className="tw-footer__list">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href as Route}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="tw-footer__heading">تواصل معنا</h2>
          <ul className="tw-footer__list">
            <li>
              <address>{address}</address>
            </li>
            <li>مواعيد العمل: {hoursLabel}</li>
          </ul>
          {!isBusinessInfoVerified && (
            <span className="tw-footer__badge" style={{ marginBlockStart: "var(--ds-space-2)" }}>
              بيانات توضيحية — لسه مش نهائية
            </span>
          )}
        </div>

        <div>
          <h2 className="tw-footer__heading">اطلب دلوقتي</h2>
          <a className="tw-footer__whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden size={18} />
            تواصل عبر واتساب
          </a>
        </div>
      </div>

      <div className="tw-footer__bottom">
        <span>© {new Date().getFullYear()} توستر كريبس آند بيتزا</span>
        <span>هنحفظ بياناتك على هذا الجهاز بس لتسهيل طلبك الجاي</span>
      </div>
    </footer>
  );
}
