"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, KeyboardEvent, ReactNode, RefObject } from "react";
export { Alert, Card, Checkbox, IconButton, Skeleton, Textarea } from "./social-primitives";
import { IconButton } from "./social-primitives";
import "./primitives.css";

type MotionConflictingProps = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "style";
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingProps> & { variant?: "primary" | "secondary" | "danger" | "ghost" | "accent" | "whatsapp"; loading?: boolean; loadingLabel?: string };
export function Button({ variant = "primary", loading = false, loadingLabel = "جارٍ التنفيذ…", disabled, children, className, ...props }: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = !disabled && !loading && !prefersReducedMotion;
  return (
    <motion.button
      data-slot="button"
      className={[`ds-button ds-button--${variant}`, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
      {...(interactive ? { whileTap: { scale: 0.96 }, whileHover: { scale: 1.015 } } : {})}
      {...props}
    >
      {loading && <span className="ds-spinner" aria-hidden="true" />}
      <span>{loading ? loadingLabel : children}</span>
    </motion.button>
  );
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id: string; label: string; hint?: string; error?: string };
export function TextField({ id, label, hint, error, className, ...props }: TextFieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="ds-field"><label className="ds-field__label" htmlFor={id}>{label}</label><input data-slot="input" className={["ds-field__control", className].filter(Boolean).join(" ")} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />{hint && <span className="ds-field__hint" id={`${id}-hint`}>{hint}</span>}{error && <span className="ds-field__error" id={`${id}-error`} role="alert">{error}</span>}</div>;
}

export function Badge({ children, label }: { children: ReactNode; label?: string }) { return <span className="ds-badge" aria-label={label}>{children}</span>; }
export function Spinner({ label = "جارٍ التحميل…" }: { label?: string }) { return <span role="status"><span className="ds-spinner" aria-hidden="true" /><span className="ds-visually-hidden">{label}</span></span>; }

/* ---------------------------------------------------------------------- */
/* Tabs — roving tabindex, sticky-capable category tabs (SCR-002).        */
/* ---------------------------------------------------------------------- */
export type TabItem = { id: string; label: string };
export type TabsProps = { items: TabItem[]; value: string; onChange: (id: string) => void; sticky?: boolean; "aria-label": string };
export function Tabs({ items, value, onChange, sticky, ...props }: TabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === value);
    if (index === -1) return;
    if (event.key === "ArrowRight") { event.preventDefault(); const next = items[(index + 1) % items.length]; if (next) onChange(next.id); }
    if (event.key === "ArrowLeft") { event.preventDefault(); const prev = items[(index - 1 + items.length) % items.length]; if (prev) onChange(prev.id); }
  };
  return (
    <div role="tablist" className="ds-tabs" data-sticky={sticky ? "true" : "false"} onKeyDown={onKeyDown} {...props}>
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          type="button"
          id={`tab-${item.id}`}
          className="ds-tab"
          aria-selected={item.id === value}
          aria-controls={`tabpanel-${item.id}`}
          tabIndex={item.id === value ? 0 : -1}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Accordion — single-open by default (FAQ section).                     */
/* ---------------------------------------------------------------------- */
export type AccordionItem = { id: string; title: string; content: ReactNode };
export function Accordion({ items, defaultOpenId }: { items: AccordionItem[]; defaultOpenId?: string }) {
  const [openId, setOpenId] = useState<string | undefined>(defaultOpenId);
  return (
    <div>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div className="ds-accordion-item" key={item.id}>
            <button
              type="button"
              className="ds-accordion-trigger"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => setOpenId(isOpen ? undefined : item.id)}
            >
              <span>{item.title}</span>
              <span className="ds-accordion-trigger__icon" aria-hidden="true">⌄</span>
            </button>
            {isOpen && (
              <div id={`accordion-panel-${item.id}`} className="ds-accordion-panel" role="region">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Focus trap shared by Dialog and Sheet.                                 */
/* ---------------------------------------------------------------------- */
function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const selector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(container?.querySelectorAll<HTMLElement>(selector) ?? []);
    focusables()[0]?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef, onClose]);
}

/* ---------------------------------------------------------------------- */
/* Dialog (centered modal) and Sheet (edge drawer — CartDrawer/QuickPreview). */
/* ---------------------------------------------------------------------- */
export type OverlayProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode };
export function Dialog({ open, onClose, title, children, footer }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="ds-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="ds-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ds-dialog__header">
          <h2 id={titleId} className="ds-dialog__title">{title}</h2>
          <IconButton label="إغلاق" onClick={onClose}>✕</IconButton>
        </div>
        {children}
        {footer && <div className="ds-dialog__header" style={{ marginBlockStart: "var(--ds-space-4)", marginBlockEnd: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

export type SheetProps = OverlayProps & { fullHeightOnMobile?: boolean };
export function Sheet({ open, onClose, title, children, footer, fullHeightOnMobile = true }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="ds-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="ds-sheet" data-full-height-mobile={fullHeightOnMobile ? "true" : "false"} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ds-dialog__header">
          <h2 id={titleId} className="ds-dialog__title">{title}</h2>
          <IconButton label="إغلاق" onClick={onClose}>✕</IconButton>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* QuantityStepper — product/cart quantity control.                       */
/* ---------------------------------------------------------------------- */
export function QuantityStepper({ value, min = 1, max = 20, onChange }: { value: number; min?: number; max?: number; onChange: (next: number) => void }) {
  return (
    <div className="ds-stepper" role="group" aria-label="الكمية">
      <IconButton label="تقليل الكمية" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</IconButton>
      <span className="ds-stepper__value" aria-live="polite">{value}</span>
      <IconButton label="زيادة الكمية" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</IconButton>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* RatingStars — display, optionally interactive.                         */
/* ---------------------------------------------------------------------- */
export function RatingStars({ value, max = 5, onChange, label }: { value: number; max?: number; onChange?: (next: number) => void; label?: string }) {
  const interactive = Boolean(onChange);
  return (
    <span className="ds-rating" role={interactive ? "radiogroup" : "img"} aria-label={label ?? `تقييم ${value} من ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < value;
        const star = <span key={index} aria-hidden={interactive ? undefined : "true"} data-empty={!filled ? "true" : "false"}>★</span>;
        if (!interactive) return star;
        return (
          <button key={index} type="button" aria-label={`${index + 1} نجوم`} aria-pressed={filled} onClick={() => onChange?.(index + 1)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit" }}>
            {star}
          </button>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* CountdownDisplay — presentational only; caller supplies the ticking    */
/* value (Africa/Cairo-computed, server/client-consistent per            */
/* docs/ux/motion-choreography.md) so this stays a pure render.           */
/* ---------------------------------------------------------------------- */
export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };
export function CountdownDisplay({ value, "aria-label": ariaLabel }: { value: CountdownParts; "aria-label": string }) {
  const units: Array<[keyof CountdownParts, string]> = [["days", "يوم"], ["hours", "ساعة"], ["minutes", "دقيقة"], ["seconds", "ثانية"]];
  return (
    <div className="ds-countdown" role="timer" aria-live="polite" aria-label={ariaLabel}>
      {units.map(([key, label]) => (
        <div className="ds-countdown__unit" key={key}>
          <span className="ds-countdown__value">{String(value[key]).padStart(2, "0")}</span>
          <span className="ds-countdown__label">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Carousel — dependency-free scroll-snap wrapper (bestsellers/testimonials). */
/* ---------------------------------------------------------------------- */
export function Carousel({ children, "aria-label": ariaLabel }: { children: ReactNode; "aria-label": string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div>
      <div className="ds-carousel-controls">
        <IconButton label="السابق" onClick={() => scrollBy(-1)}>‹</IconButton>
        <IconButton label="التالي" onClick={() => scrollBy(1)}>›</IconButton>
      </div>
      <div ref={ref} className="ds-carousel" role="region" aria-label={ariaLabel} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Toast — lightweight live-region announcer.                             */
/* ---------------------------------------------------------------------- */
export type ToastItem = { id: string; tone?: "success" | "error"; message: string };
export function ToastRegion({ items }: { items: ToastItem[] }) {
  return (
    <div className="ds-toast-region" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={["ds-toast", item.tone && `ds-toast--${item.tone}`].filter(Boolean).join(" ")} role="status">
          {item.message}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PhoneField — Egyptian phone number input, thin TextField preset.       */
/* ---------------------------------------------------------------------- */
export function PhoneField(props: Omit<TextFieldProps, "type" | "inputMode">) {
  return <TextField type="tel" inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" {...props} />;
}
