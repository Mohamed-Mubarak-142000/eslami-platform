"use client";

import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Badge, Button } from "../ui";
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
