"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string | undefined;
  hint?: ReactNode;
}

export function Field({ label, name, error, hint, type = "text", className, ...rest }: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-emerald/50 focus:shadow-soft",
            error ? "border-rose" : "border-line",
            isPassword && "pe-12",
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-emerald-mist hover:text-ink"
            aria-label={reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-rose">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg", cn("w-full", className))}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function FormAlert({ error, message, className }: { error?: string | undefined; message?: string | undefined; className?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold",
        error ? "bg-rose/10 text-rose" : "bg-emerald-mist text-emerald-deep",
        className,
      )}
    >
      {error ?? message}
    </p>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-bold text-muted" aria-hidden>
      <span className="h-px flex-1 bg-line" /> أو <span className="h-px flex-1 bg-line" />
    </div>
  );
}
