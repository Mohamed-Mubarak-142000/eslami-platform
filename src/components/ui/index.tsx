import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import "./primitives.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger"; loading?: boolean; loadingLabel?: string };
export function Button({ variant = "primary", loading = false, loadingLabel = "جارٍ التنفيذ…", disabled, children, ...props }: ButtonProps) {
  return <button className={`ds-button ds-button--${variant}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <span className="ds-spinner" aria-hidden="true" />}<span>{loading ? loadingLabel : children}</span></button>;
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id: string; label: string; hint?: string; error?: string };
export function TextField({ id, label, hint, error, ...props }: TextFieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="ds-field"><label className="ds-field__label" htmlFor={id}>{label}</label><input className="ds-field__control" id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />{hint && <span className="ds-field__hint" id={`${id}-hint`}>{hint}</span>}{error && <span className="ds-field__error" id={`${id}-error`} role="alert">{error}</span>}</div>;
}

export function Badge({ children, label }: { children: ReactNode; label?: string }) { return <span className="ds-badge" aria-label={label}>{children}</span>; }
export function Spinner({ label = "جارٍ التحميل…" }: { label?: string }) { return <span role="status"><span className="ds-spinner" aria-hidden="true" /><span className="ds-visually-hidden">{label}</span></span>; }
