import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import "./social-primitives.css";

const classes = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ");

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card" className={classes("ds-social-card", className)} {...props} />;
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea data-slot="textarea" className={classes("ds-textarea", className)} {...props} />;
}
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode };
export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  return <label className={classes("ds-checkbox", className)} htmlFor={id}><input data-slot="checkbox" id={id} type="checkbox" {...props} /><span><span className="ds-checkbox__label">{label}</span>{description && <span className="ds-checkbox__description">{description}</span>}</span></label>;
}
export type AlertProps = HTMLAttributes<HTMLDivElement> & { tone?: "info" | "success" | "warning" | "error"; title?: ReactNode };
export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  return <div data-slot="alert" className={classes("ds-alert", `ds-alert--${tone}`, className)} role={tone === "error" ? "alert" : "status"} {...props}>{title && <strong className="ds-alert__title">{title}</strong>}{children}</div>;
}
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" className={classes("ds-skeleton", className)} aria-hidden="true" {...props} />;
}
export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };
export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return <button data-slot="button" className={classes("ds-icon-button", className)} aria-label={label} title={label} {...props}>{children}</button>;
}
