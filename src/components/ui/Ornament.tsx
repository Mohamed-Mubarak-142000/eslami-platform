import { cn } from "@/lib/cn";

/** Eight-pointed star (khatam) used as the brand mark and as dividers. */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M24 2l5.6 13.5L44 10l-5.5 14L44 38l-14.4-5.5L24 46l-5.6-13.5L4 38l5.5-14L4 10l14.4 5.5z" fill="currentColor" />
      <circle cx="24" cy="24" r="7" fill="none" stroke="var(--color-ivory)" strokeWidth="2" />
    </svg>
  );
}

export function Divider({ className, tone = "gold" }: { className?: string; tone?: "gold" | "light" }) {
  const line =
    tone === "gold"
      ? "bg-linear-to-l from-transparent via-gold/60 to-transparent"
      : "bg-linear-to-l from-transparent via-white/40 to-transparent";
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden="true">
      <span className={cn("h-px flex-1", line)} />
      <StarMark className={cn("size-4", tone === "gold" ? "text-gold" : "text-white/70")} />
      <span className={cn("h-px flex-1", line)} />
    </div>
  );
}

/** Rounded mosque-arch silhouette used to frame imagery. */
export function ArchFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-b-3xl [border-top-left-radius:50%_32%] [border-top-right-radius:50%_32%]", className)}
    >
      {children}
    </div>
  );
}
