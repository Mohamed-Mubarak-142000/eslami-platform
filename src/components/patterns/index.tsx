"use client";

import { BadgeCheck } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Accordion, Badge, Button, RatingStars, type AccordionItem } from "../ui";
import "./patterns.css";
export { AuthShell, ComposerCard, ErrorSummary, SocialContentCard, TopicHighlights } from "./social";
export type { AuthShellProps, ComposerCardProps, ErrorSummaryItem, SocialContentCardProps, TopicHighlight } from "./social";

export type VerificationStatus = "approved" | "suspended" | "revoked" | "unverified";
export interface ScholarIdentityProps { name: string; specialty: string; status: VerificationStatus; avatarUrl?: string; initials: string; onTrustDetails?: () => void }
export function ScholarIdentity({ name, specialty, status, avatarUrl, initials, onTrustDetails }: ScholarIdentityProps) {
  const t = useTranslations("patterns");
  const statusText = status === "approved" ? t.scholarVerified : status === "unverified" ? t.scholarUnverified : t.scholarVerificationInactive;
  return (
    <article className="ds-scholar">
      <span className="ds-scholar__avatar" aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span>
      <div>
        <h3 className="ds-scholar__name" dir="auto">{name}</h3>
        <div className="ds-scholar__meta" dir="auto">{specialty}</div>
        <button type="button" className="ds-scholar__status" onClick={onTrustDetails} aria-label={t.scholarTrustDetailsAria(statusText)}>
          {status === "approved" && <BadgeCheck size={14} aria-hidden="true" />} {statusText}
        </button>
      </div>
    </article>
  );
}

export interface TrustMarkProps { status: VerificationStatus; verifiedAt?: string; children?: ReactNode }
export function TrustMark({ status, verifiedAt, children }: TrustMarkProps) {
  const t = useTranslations("patterns");
  const active = status === "approved";
  return (
    <details className="ds-trust" data-status={active ? "active" : "inactive"}>
      <summary>{active ? t.trustActiveSummary : t.trustInactiveSummary}</summary>
      <p>{active ? t.trustActiveDescription : t.trustInactiveDescription}</p>
      {verifiedAt && <p>{t.trustLastVerified} <time dateTime={verifiedAt}>{verifiedAt}</time></p>}
      <p>{t.trustDisclaimer}</p>
      {children}
    </details>
  );
}

export interface SourceCitationProps { index: number; type: string; title: string; authorOrOrg?: string; locator?: string; url?: string }
export function SourceCitation({ index, type, title, authorOrOrg, locator, url }: SourceCitationProps) {
  const t = useTranslations("patterns");
  return (
    <aside className="ds-source" aria-label={t.sourceAria(index)}>
      <div className="ds-source__index">[{index}] {type}</div>
      <div className="ds-source__title" dir="auto">{title}</div>
      {(authorOrOrg || locator) && <div className="ds-source__meta" dir="auto">{[authorOrOrg, locator].filter(Boolean).join(" — ")}</div>}
      {url ? <a href={url} target="_blank" rel="noreferrer">{t.sourceOpen} <span className="ds-visually-hidden">{t.sourceOpensNewWindow}</span></a> : <p className="ds-source__meta">{t.sourceUnavailable}</p>}
    </aside>
  );
}

export interface OpinionGroupProps { id: string; label: string; summary: string; applicability?: string; reviewedAt?: string; evidence: ReactNode }
export function OpinionGroup({ id, label, summary, applicability, reviewedAt, evidence }: OpinionGroupProps) {
  const t = useTranslations("patterns");
  return (
    <article className="ds-card ds-opinion" aria-labelledby={`${id}-title`}>
      <h3 className="ds-opinion__title" id={`${id}-title`} dir="auto">{label}</h3>
      <p dir="auto">{summary}</p>
      {applicability && <p><strong>{t.opinionApplicability} </strong><span dir="auto">{applicability}</span></p>}
      <div aria-label={t.opinionEvidenceAria}>{evidence}</div>
      {reviewedAt && <small>{t.opinionLastReviewed} <time dateTime={reviewedAt}>{reviewedAt}</time></small>}
    </article>
  );
}

export type AsyncActionState = "idle" | "pending" | "success" | "error" | "uncertain";
export interface AsyncActionProps { state: AsyncActionState; label: string; pendingLabel?: string; message?: string; onAction: () => void; onRetry?: () => void }
export function AsyncAction({ state, label, pendingLabel, message, onAction, onRetry }: AsyncActionProps) {
  const t = useTranslations("patterns");
  const common = useTranslations("common");
  const pending = state === "pending";
  return (
    <div className="ds-async">
      <Button loading={pending} loadingLabel={pendingLabel ?? t.asyncSavingLabel} onClick={onAction}>{label}</Button>
      <div className="ds-async__message" data-tone={state === "error" || state === "uncertain" ? "error" : "neutral"} role={state === "error" ? "alert" : "status"} aria-live="polite">{message}</div>
      {(state === "error" || state === "uncertain") && onRetry && <Button variant="secondary" onClick={onRetry}>{common.retry}</Button>}
    </div>
  );
}

export interface TimelineItem { id: string; status: string; description: string; timestamp: string; actorLabel?: string }
export function StatusTimeline({ items, label }: { items: readonly TimelineItem[]; label?: string }) {
  const t = useTranslations("patterns");
  return (
    <ol className="ds-timeline" aria-label={label ?? t.timelineDefaultLabel}>
      {items.map(item => (
        <li className="ds-timeline__item" key={item.id}>
          <Badge>{item.status}</Badge>
          <p dir="auto">{item.description}</p>
          {item.actorLabel && <small dir="auto">{item.actorLabel} · </small>}
          <time dateTime={item.timestamp}>{item.timestamp}</time>
        </li>
      ))}
    </ol>
  );
}

export type StateKind = "loading" | "empty" | "error" | "offline" | "permission" | "privacy" | "conflict";
export interface StatePanelProps { kind: StateKind; title: string; message: string; action?: ReactNode }
export function StatePanel({ kind, title, message, action }: StatePanelProps) {
  const urgent = kind === "error" || kind === "conflict";
  return <section className="ds-card ds-state" role={urgent ? "alert" : "status"} aria-live={urgent ? "assertive" : "polite"}><h2 className="ds-state__title">{title}</h2><p className="ds-state__message" dir="auto">{message}</p>{action}</section>;
}

/* ---------------------------------------------------------------------- */
/* Twister storefront patterns (docs/ux/component-inventory.md PAT-01..07) */
/* Arabic copy is hardcoded (product decision: Arabic-only UI, no i18n     */
/* toggle for this milestone) — no dependency on src/i18n dictionaries.    */
/* ---------------------------------------------------------------------- */

export interface ProductCardProps {
  name: string;
  imageUrl?: string;
  priceFromLabel: string;
  isBestseller?: boolean;
  isAvailable?: boolean;
  onAdd?: () => void;
  onOpen?: () => void;
}
export function ProductCard({ name, imageUrl, priceFromLabel, isBestseller, isAvailable = true, onAdd, onOpen }: ProductCardProps) {
  return (
    <article className="ds-product-card" data-available={isAvailable ? "true" : "false"}>
      <button type="button" className="ds-product-card__media" onClick={onOpen} aria-label={`عرض تفاصيل ${name}`}>
        {imageUrl ? <img src={imageUrl} alt={name} /> : null}
        {isBestseller && <span className="ds-badge ds-product-card__badge">الأكثر طلبًا</span>}
        {!isAvailable && <span className="ds-badge ds-product-card__badge">غير متاح حاليًا</span>}
      </button>
      <h3 className="ds-product-card__name" dir="auto">{name}</h3>
      <div className="ds-cluster" style={{ justifyContent: "space-between" }}>
        <span className="ds-product-card__price">{priceFromLabel}</span>
        <Button variant="primary" onClick={onAdd} disabled={!isAvailable}>أضف للسلة</Button>
      </div>
    </article>
  );
}

export interface CategoryChipProps { label: string; imageUrl?: string; active?: boolean; onClick?: () => void }
export function CategoryChip({ label, imageUrl, active, onClick }: CategoryChipProps) {
  return (
    <button type="button" className="ds-category-chip" aria-current={active ? "true" : "false"} onClick={onClick}>
      <span className="ds-category-chip__icon" aria-hidden="true">{imageUrl ? <img src={imageUrl} alt="" /> : label.slice(0, 1)}</span>
      <span>{label}</span>
    </button>
  );
}

export interface OfferBannerProps { title: string; description: string; ctaLabel?: string; onCtaClick?: () => void; countdown?: ReactNode }
export function OfferBanner({ title, description, ctaLabel = "اطلب الآن", onCtaClick, countdown }: OfferBannerProps) {
  return (
    <article className="ds-offer-banner ds-sparkle">
      <h3 className="ds-offer-banner__title" dir="auto">{title}</h3>
      <p className="ds-offer-banner__description" dir="auto">{description}</p>
      {countdown}
      <Button variant="accent" onClick={onCtaClick}>{ctaLabel}</Button>
    </article>
  );
}

export interface TestimonialCardProps { authorName: string; rating: number; text: string; isPlaceholder?: boolean }
export function TestimonialCard({ authorName, rating, text, isPlaceholder }: TestimonialCardProps) {
  return (
    <article className="ds-card ds-testimonial-card">
      <RatingStars value={rating} label={`تقييم ${authorName}`} />
      <p className="ds-testimonial-card__text" dir="auto">“{text}”</p>
      <div className="ds-cluster" style={{ justifyContent: "space-between" }}>
        <strong dir="auto">{authorName}</strong>
        {isPlaceholder && <Badge>تقييم توضيحي</Badge>}
      </div>
    </article>
  );
}

export interface ZoneCardProps { name: string; deliveryFeeLabel: string; minOrderLabel: string; isServed?: boolean }
export function ZoneCard({ name, deliveryFeeLabel, minOrderLabel, isServed = true }: ZoneCardProps) {
  return (
    <article className="ds-card ds-zone-card" data-served={isServed ? "true" : "false"}>
      <div>
        <strong dir="auto">{name}</strong>
        <div className="ds-async__message" style={{ minBlockSize: "auto" }}>{isServed ? `توصيل ${deliveryFeeLabel} · حد أدنى ${minOrderLabel}` : "غير مخدومة حاليًا"}</div>
      </div>
      {!isServed && <Badge>غير متاحة</Badge>}
    </article>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="ds-section-heading">
      <h2 className="ds-section-heading__title" dir="auto">{title}</h2>
      {subtitle && <p className="ds-section-heading__subtitle" dir="auto">{subtitle}</p>}
    </div>
  );
}

export interface CtaSectionProps { title: string; description?: string; ctaLabel: string; onCtaClick?: () => void }
export function CtaSection({ title, description, ctaLabel, onCtaClick }: CtaSectionProps) {
  return (
    <section className="ds-cta-section ds-glow-primary">
      <h2 dir="auto">{title}</h2>
      {description && <p dir="auto">{description}</p>}
      <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
    </section>
  );
}

/**
 * Presentational only — the count-up tween belongs to foundation-agent's
 * `useCountUp` motion hook (src/lib/motion), applied by feature-ui-agent.
 * This pattern just renders whatever numeric value it is given.
 */
export function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="ds-stat-counter">
      <span className="ds-stat-counter__value">{value}</span>
      <span className="ds-stat-counter__label" dir="auto">{label}</span>
    </div>
  );
}

export function FaqList({ items }: { items: AccordionItem[] }) {
  return <Accordion items={items} />;
}

/* --- Admin patterns ----------------------------------------------------- */

export interface AdminColumn<T> { key: string; header: string; render: (row: T) => ReactNode }
export function AdminDataTable<T>({ columns, rows, emptyMessage, getRowKey }: { columns: AdminColumn<T>[]; rows: T[]; emptyMessage: string; getRowKey: (row: T) => string }) {
  if (rows.length === 0) return <p className="ds-async__message">{emptyMessage}</p>;
  return (
    <table className="ds-admin-table">
      <thead>
        <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function AdminFormLayout({ children, onSubmit, submitLabel = "حفظ" }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitLabel?: string }) {
  return (
    <form className="ds-admin-form" onSubmit={onSubmit}>
      {children}
      <Button type="submit" variant="primary">{submitLabel}</Button>
    </form>
  );
}

export function AdminStatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="ds-admin-stat-tile">
      <div className="ds-admin-stat-tile__value">{value}</div>
      <div className="ds-admin-stat-tile__label" dir="auto">{label}</div>
      {hint && <div className="ds-admin-stat-tile__label" dir="auto">{hint}</div>}
    </div>
  );
}

/** SCR-021: the always-visible reminder that admin data is local to this browser only. */
export function AdminLocalDataNotice() {
  return (
    <p className="ds-admin-local-notice" role="status">
      الأرقام والطلبات هنا محلية على هذا المتصفح فقط، مش قاعدة بيانات مركزية.
    </p>
  );
}
