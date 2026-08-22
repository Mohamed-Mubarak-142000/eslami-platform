import type { FormEventHandler, ReactNode } from "react";
import { Button, Card, Textarea } from "../ui";
import "./social.css";

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  trustPoints?: readonly string[];
  footer?: ReactNode;
  busy?: boolean;
}
export function AuthShell({ title, description, children, trustPoints = [], footer, busy = false }: AuthShellProps) {
  return <div className="ds-auth-shell" data-slot="auth-shell" aria-busy={busy || undefined}>
    <aside className="ds-auth-shell__promise" aria-label="عن المنصة"><p className="ds-auth-shell__eyebrow">معرفة موثوقة، بهدوء</p><h2>{description}</h2>{trustPoints.length > 0 && <ul>{trustPoints.map(point => <li key={point}>{point}</li>)}</ul>}</aside>
    <main className="ds-auth-shell__main"><Card className="ds-auth-card"><header><h1>{title}</h1><p>{description}</p></header>{children}</Card>{footer && <footer className="ds-auth-shell__footer">{footer}</footer>}</main>
  </div>;
}

export interface ErrorSummaryItem { id: string; label: string }
export function ErrorSummary({ title = "راجع البيانات التالية", items }: { title?: string; items: readonly ErrorSummaryItem[] }) {
  if (items.length === 0) return null;
  return <div className="ds-error-summary" role="alert" tabIndex={-1}><strong>{title}</strong><ul>{items.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ul></div>;
}

export interface TopicHighlight { id: string; label: string; meta?: string }
export function TopicHighlights({ items, activeId, onSelect, label = "موضوعات مختارة" }: { items: readonly TopicHighlight[]; activeId?: string; onSelect?: (id: string) => void; label?: string }) {
  return <section className="ds-highlights" aria-label={label}><div className="ds-highlights__track">{items.map(item => <button key={item.id} type="button" className="ds-highlight" aria-pressed={activeId === item.id} onClick={() => onSelect?.(item.id)}><span className="ds-highlight__mark" aria-hidden="true">{item.label.slice(0, 1)}</span><span>{item.label}</span>{item.meta && <small>{item.meta}</small>}</button>)}</div></section>;
}

export interface ComposerCardProps {
  author: ReactNode;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  privacyControl?: ReactNode;
  error?: string;
  busy?: boolean;
}
export function ComposerCard({ author, label, placeholder, value, onChange, onSubmit, privacyControl, error, busy = false }: ComposerCardProps) {
  const describedBy = error ? "ds-composer-error" : undefined;
  return <Card className="ds-composer"><form onSubmit={onSubmit} aria-label={label} aria-busy={busy || undefined}><div className="ds-composer__author">{author}</div><label className="ds-visually-hidden" htmlFor="ds-composer-input">{label}</label><Textarea id="ds-composer-input" placeholder={placeholder} value={value} onChange={event => onChange?.(event.currentTarget.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} />{error && <p className="ds-field__error" id="ds-composer-error" role="alert">{error}</p>}<div className="ds-composer__footer">{privacyControl}<Button type="submit" loading={busy}>نشر المساهمة</Button></div></form></Card>;
}

export interface SocialContentCardProps {
  id: string;
  author: ReactNode;
  title?: string;
  children: ReactNode;
  citation?: ReactNode;
  meta?: ReactNode;
  helpful?: boolean;
  saved?: boolean;
  busyAction?: "helpful" | "save";
  onHelpful?: () => void;
  onSave?: () => void;
  commentAction?: ReactNode;
}
export function SocialContentCard({ id, author, title, children, citation, meta, helpful = false, saved = false, busyAction, onHelpful, onSave, commentAction }: SocialContentCardProps) {
  const titleId = `${id}-title`;
  return <article className="ds-social-post" aria-labelledby={title ? titleId : undefined} aria-busy={Boolean(busyAction) || undefined}><header>{author}<div className="ds-social-post__meta">{meta}</div></header><div className="ds-social-post__body">{title && <h2 id={titleId}>{title}</h2>}{children}</div>{citation && <div className="ds-social-post__citation">{citation}</div>}<footer className="ds-social-post__actions" aria-label="إجراءات المحتوى"><Button type="button" variant="ghost" aria-pressed={helpful} loading={busyAction === "helpful"} loadingLabel="جارٍ التحديث…" onClick={onHelpful}>مفيد</Button>{commentAction}<Button type="button" variant="ghost" aria-pressed={saved} loading={busyAction === "save"} loadingLabel="جارٍ الحفظ…" onClick={onSave}>{saved ? "محفوظ" : "حفظ"}</Button></footer></article>;
}
