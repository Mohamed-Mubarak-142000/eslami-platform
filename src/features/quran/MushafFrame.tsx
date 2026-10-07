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

export function PageMedallion({ page }: { page: number }) {
  return (
    <span className="relative mx-auto grid size-10 place-items-center sm:size-12">
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full text-gold" aria-hidden>
        <path
          d="M24 2l5.6 13.5L44 10l-5.5 14L44 38l-14.4-5.5L24 46l-5.6-13.5L4 38l5.5-14L4 10l14.4 5.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="24" cy="24" r="12" fill="currentColor" opacity="0.14" />
      </svg>
      <span className="relative font-display text-sm font-bold">{toArabicDigits(page)}</span>
    </span>
  );
}

interface MushafFrameProps {
  headerStart: ReactNode;
  headerEnd: ReactNode;
  page: number;
  children: ReactNode;
}

/** Ornamental mushaf page: double gold rule, corner rosettes, running header, page medallion. */
export function MushafFrame({ headerStart, headerEnd, page, children }: MushafFrameProps) {
  return (
    <div className="pattern-stars relative rounded-[1.75rem] p-1.5 shadow-lift sm:p-3" style={{ background: "var(--frame-bg)" }}>
      <div className="rounded-[1.35rem] border-2 border-gold/70 p-1 sm:p-1.5">
        <div
          className="relative rounded-[1rem] border border-gold/45 px-3 pb-2 pt-2.5 sm:px-10 sm:pb-4 sm:pt-4"
          style={{ background: "var(--page-bg)", color: "var(--page-ink)" }}
        >
          <FrameCorner className="right-1 top-1 -scale-x-100" />
          <FrameCorner className="left-1 top-1" />
          <FrameCorner className="bottom-1 right-1 rotate-180" />
          <FrameCorner className="bottom-1 left-1 -scale-y-100" />

          <div
            className="relative flex items-center justify-between gap-3 border-b border-gold/30 px-6 pb-2 text-xs font-bold sm:text-sm"
            style={{ color: "var(--page-accent)" }}
          >
            <span>{headerStart}</span>
            <span>{headerEnd}</span>
          </div>
          <div className="relative px-1 py-3 sm:px-3 sm:py-5">{children}</div>
          <div className="relative border-t border-gold/30 pt-2" style={{ color: "var(--page-accent)" }}>
            <PageMedallion page={page} />
          </div>
        </div>
      </div>
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
