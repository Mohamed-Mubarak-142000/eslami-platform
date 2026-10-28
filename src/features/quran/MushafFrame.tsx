import type { ReactNode } from "react";
import { toArabicDigits } from "@/lib/arabic";

export function FrameCorner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`pointer-events-none absolute size-12 text-gold sm:size-14 ${className}`} aria-hidden>
      <path d="M2 2h40v3H5v37H2z" fill="currentColor" opacity="0.9" />
      <path d="M9 9h22v2H11v20H9z" fill="currentColor" opacity="0.55" />
      <path d="M20 12l2.8 6.7L30 16l-2.8 7L30 30l-7.2-2.8L20 34l-2.8-6.8L10 30l2.7-7L10 16l7.2 2.7z" fill="currentColor" />
      <circle cx="20" cy="23" r="3" fill="var(--page-bg)" />
    </svg>
  );
}

interface MushafFrameProps {
  headerStart: ReactNode;
  headerEnd: ReactNode;
  page: number;
  children: ReactNode;
}

/** A plain mushaf page, as printed: the running header above the text and the page number under it, no frame. */
export function MushafFrame({ headerStart, headerEnd, page, children }: MushafFrameProps) {
  return (
    <div
      className="relative px-2 pb-2 pt-2 sm:rounded-[1.25rem] sm:px-10 sm:pb-4 sm:pt-4"
      style={{ background: "var(--page-bg)", color: "var(--page-ink)" }}
    >
      <div className="flex items-center justify-between gap-3 px-2 text-xs font-bold sm:text-sm" style={{ color: "var(--page-accent)" }}>
        <span>{headerStart}</span>
        <span>{headerEnd}</span>
      </div>
      <div className="px-1 py-3 sm:px-3 sm:py-5">{children}</div>
      <p className="text-center font-display text-sm font-bold" style={{ color: "var(--page-accent)" }}>
        {toArabicDigits(page)}
      </p>
    </div>
  );
}

export function SurahBanner({ name }: { name: string }) {
  return (
    <div className="relative mx-auto mb-2 flex max-w-md items-center justify-center sm:mb-3">
      <svg viewBox="0 0 400 64" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <path d="M24 4h352l20 28-20 28H24L4 32z" fill="var(--color-emerald)" stroke="var(--color-gold)" strokeWidth="3" />
        <path d="M34 11h332l14 21-14 21H34L20 32z" fill="none" stroke="var(--color-gold)" strokeOpacity="0.6" strokeWidth="1.5" />
      </svg>
      <h2 className="relative py-2 font-quran text-xl text-white sm:py-2.5 sm:text-2xl">سورة {name}</h2>
    </div>
  );
}
