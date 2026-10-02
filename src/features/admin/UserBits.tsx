import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { AppRole } from "@/lib/supabase/database.types";

const FULL_DATE = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DATE_TIME = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Cairo",
});

export const PROVIDERS: Record<string, string> = { email: "البريد", google: "Google" };

/** "٢ أكتوبر ٢٠٢٦". */
export function formatFullDate(iso: string): string {
  return FULL_DATE.format(new Date(iso));
}

/** "٢ أكتوبر ٢٠٢٦، ٢:٣١ م" in Cairo time. */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** Whole days between an ISO date/timestamp and now. */
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** "اليوم" / "أمس" / "منذ ٥ أيام" / "منذ ٣ أشهر". */
export function relativeDay(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  if (days < 11) return `منذ ${toArabicDigits(days)} أيام`;
  if (days < 30) return `منذ ${toArabicDigits(days)} يومًا`;
  const months = Math.floor(days / 30);
  if (months === 1) return "منذ شهر";
  if (months === 2) return "منذ شهرين";
  if (months < 12) return `منذ ${toArabicDigits(months)} ${months < 11 ? "أشهر" : "شهرًا"}`;
  return formatFullDate(iso);
}

export function UserAvatar({ name, disabled, role, className }: { name: string; disabled?: boolean; role?: AppRole; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "؟";
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        disabled ? "bg-rose/10 text-rose" : role === "admin" ? "bg-gold-mist text-gold-deep" : "bg-emerald-mist text-emerald",
        className ?? "size-10 text-base",
      )}
    >
      {initial}
    </span>
  );
}

export function UserBadges({ role, disabled, className }: { role: AppRole; disabled: boolean; className?: string }) {
  return (
    <>
      {role === "admin" && (
        <span className={cn("rounded-full bg-gold-mist px-2 py-0.5 text-[0.7rem] font-bold text-gold-deep", className)}>مدير</span>
      )}
      {disabled && <span className={cn("rounded-full bg-rose/10 px-2 py-0.5 text-[0.7rem] font-bold text-rose", className)}>موقوف</span>}
    </>
  );
}
