import type { ReactNode } from "react";
import { Badge, Button } from "../ui";
import "./patterns.css";
export { AuthShell, ComposerCard, ErrorSummary, SocialContentCard, TopicHighlights } from "./social";
export type { AuthShellProps, ComposerCardProps, ErrorSummaryItem, SocialContentCardProps, TopicHighlight } from "./social";

export type VerificationStatus = "approved" | "suspended" | "revoked" | "unverified";
export interface ScholarIdentityProps { name: string; specialty: string; status: VerificationStatus; avatarUrl?: string; initials: string; onTrustDetails?: () => void }
export function ScholarIdentity({ name, specialty, status, avatarUrl, initials, onTrustDetails }: ScholarIdentityProps) {
  const statusText = status === "approved" ? "موثّق" : status === "unverified" ? "غير موثّق" : "التوثيق غير ساري";
  return <article className="ds-scholar"><span className="ds-scholar__avatar" aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span><div><h3 className="ds-scholar__name" dir="auto">{name}</h3><div className="ds-scholar__meta" dir="auto">{specialty}</div><button type="button" onClick={onTrustDetails} aria-label={`${statusText}: عرض تفاصيل التوثيق`}>{statusText}</button></div></article>;
}

export interface TrustMarkProps { status: VerificationStatus; verifiedAt?: string; children?: ReactNode }
export function TrustMark({ status, verifiedAt, children }: TrustMarkProps) {
  const active = status === "approved";
  return <details className="ds-trust" data-status={active ? "active" : "inactive"}><summary>{active ? "موثّق — ما معنى ذلك؟" : "التوثيق غير ساري حاليًا"}</summary><p>{active ? "تم التحقق من الهوية والمسار العلمي والتخصص وقت الاعتماد." : "لا تظهر لهذا الحساب شارة اعتماد سارية."}</p>{verifiedAt && <p>آخر تحقق: <time dateTime={verifiedAt}>{verifiedAt}</time></p>}<p>لا يعني التوثيق موافقة المنصة على كل رأي.</p>{children}</details>;
}

export interface SourceCitationProps { index: number; type: string; title: string; authorOrOrg?: string; locator?: string; url?: string }
export function SourceCitation({ index, type, title, authorOrOrg, locator, url }: SourceCitationProps) {
  return <aside className="ds-source" aria-label={`المصدر ${index}`}><div className="ds-source__index">[{index}] {type}</div><div className="ds-source__title" dir="auto">{title}</div>{(authorOrOrg || locator) && <div className="ds-source__meta" dir="auto">{[authorOrOrg, locator].filter(Boolean).join(" — ")}</div>}{url ? <a href={url} target="_blank" rel="noreferrer">فتح المصدر <span className="ds-visually-hidden">في نافذة جديدة</span></a> : <p className="ds-source__meta">الرابط غير متاح؛ يمكنك مراجعة بيانات المرجع أعلاه.</p>}</aside>;
}

export interface OpinionGroupProps { id: string; label: string; summary: string; applicability?: string; reviewedAt?: string; evidence: ReactNode }
export function OpinionGroup({ id, label, summary, applicability, reviewedAt, evidence }: OpinionGroupProps) {
  return <article className="ds-card ds-opinion" aria-labelledby={`${id}-title`}><h3 className="ds-opinion__title" id={`${id}-title`} dir="auto">{label}</h3><p dir="auto">{summary}</p>{applicability && <p><strong>حدود التطبيق: </strong><span dir="auto">{applicability}</span></p>}<div aria-label="الأدلة والمصادر">{evidence}</div>{reviewedAt && <small>آخر مراجعة: <time dateTime={reviewedAt}>{reviewedAt}</time></small>}</article>;
}

export type AsyncActionState = "idle" | "pending" | "success" | "error" | "uncertain";
export interface AsyncActionProps { state: AsyncActionState; label: string; pendingLabel?: string; message?: string; onAction: () => void; onRetry?: () => void }
export function AsyncAction({ state, label, pendingLabel = "جارٍ الحفظ…", message, onAction, onRetry }: AsyncActionProps) {
  const pending = state === "pending";
  return <div className="ds-async"><Button loading={pending} loadingLabel={pendingLabel} onClick={onAction}>{label}</Button><div className="ds-async__message" data-tone={state === "error" || state === "uncertain" ? "error" : "neutral"} role={state === "error" ? "alert" : "status"} aria-live="polite">{message}</div>{(state === "error" || state === "uncertain") && onRetry && <Button variant="secondary" onClick={onRetry}>إعادة المحاولة</Button>}</div>;
}

export interface TimelineItem { id: string; status: string; description: string; timestamp: string; actorLabel?: string }
export function StatusTimeline({ items, label = "سجل الحالة" }: { items: readonly TimelineItem[]; label?: string }) {
  return <ol className="ds-timeline" aria-label={label}>{items.map(item => <li className="ds-timeline__item" key={item.id}><Badge>{item.status}</Badge><p dir="auto">{item.description}</p>{item.actorLabel && <small dir="auto">{item.actorLabel} · </small>}<time dateTime={item.timestamp}>{item.timestamp}</time></li>)}</ol>;
}

export type StateKind = "loading" | "empty" | "error" | "offline" | "permission" | "privacy" | "conflict";
export interface StatePanelProps { kind: StateKind; title: string; message: string; action?: ReactNode }
export function StatePanel({ kind, title, message, action }: StatePanelProps) { const urgent = kind === "error" || kind === "conflict"; return <section className="ds-card ds-state" role={urgent ? "alert" : "status"} aria-live={urgent ? "assertive" : "polite"}><h2 className="ds-state__title">{title}</h2><p className="ds-state__message" dir="auto">{message}</p>{action}</section>; }
