import type { NafhaEmoji, NafhaRow } from "@/lib/supabase/database.types";

/** Shared by the admin composer, the server actions and the channel (client-safe). */
export const NAFAHAT_TITLE = "نفحات المنارة";
export const NAFAHAT_TAG = "nafahat";
export const NAFAHAT_BUCKET = "nafahat";
/** Matches the bucket's file_size_limit (supabase/migrations/20261114000001_nafahat.sql). */
export const NAFAHAT_MAX_BYTES = 50 * 1024 * 1024;
export const NAFAHAT_MEDIA_TYPES: Record<string, { ext: string; kind: "image" | "video" }> = {
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
};
/** Media files are named "<uuid>.<ext>" at the bucket's root. */
export const NAFAHAT_PATH = /^[0-9a-f-]{36}\.(png|jpg|webp|mp4|mov|webm)$/;

export const NAFAHAT_EMOJIS: { id: NafhaEmoji; char: string; label: string }[] = [
  { id: "heart", char: "❤️", label: "أحببتها" },
  { id: "dua", char: "🤲", label: "آمين" },
  { id: "star", char: "🌟", label: "ملهمة" },
  { id: "like", char: "👍", label: "أوافق" },
];

export type Nafha = Pick<NafhaRow, "id" | "title" | "body" | "media_type" | "media_url" | "created_at">;
export type ReactionCounts = Partial<Record<NafhaEmoji, number>>;

/** The chat's wallpaper: faint gold crescents, stars and dots on warm ivory, tiled. */
export const CHAT_WALLPAPER = {
  backgroundColor: "var(--color-ivory-deep)",
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='92' height='92' viewBox='0 0 92 92'><g fill='none' stroke='#9c7a26' stroke-opacity='.14' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M22 13a9 9 0 1 0 7 14 10 10 0 1 1-7-14z'/><path d='m64 55 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z'/><circle cx='70' cy='19' r='2.3'/><circle cx='22' cy='70' r='3.2'/><path d='M43 43h6M46 40v6'/></g></svg>",
  )}")`,
} as const;

/** localStorage key: the id of the latest nafha the visitor has already been shown. */
export const LAST_SEEN_KEY = "nafahat:lastSeen";

// One fixed zone, so the server's render and the browser's agree (the audience is in Egypt).
const ZONE = "Africa/Cairo";
const DATE = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: ZONE });
const TIME = new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit", timeZone: ZONE });
const DAY = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: ZONE });
const WEEKDAY = new Intl.DateTimeFormat("ar-EG", { weekday: "long", timeZone: ZONE });
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE });

export const formatNafhaDate = (iso: string) => DATE.format(new Date(iso));
/** "٩:٣٠ م", the time inside a chat bubble. */
export const formatNafhaTime = (iso: string) => TIME.format(new Date(iso));
/** "2026-11-15" in Cairo, to group the chat by day. */
export const nafhaDayKey = (iso: string | Date) => DAY_KEY.format(typeof iso === "string" ? new Date(iso) : iso);

/**
 * The chat's day separator: "اليوم", "أمس", the weekday within the week, else the date. Without `now`
 * (the server render, which is cached) it is always the date, so both renders match until the page mounts.
 */
export function nafhaDayLabel(iso: string, now: Date | null): string {
  const date = new Date(iso);
  if (now) {
    const days = Math.round((Date.parse(nafhaDayKey(now)) - Date.parse(nafhaDayKey(date))) / 86_400_000);
    if (days === 0) return "اليوم";
    if (days === 1) return "أمس";
    if (days > 1 && days < 7) return WEEKDAY.format(date);
  }
  return DAY.format(date);
}

/** A file name for downloads: the title, made safe for file systems. */
export function downloadName(nafha: Pick<Nafha, "title" | "media_url">): string {
  const ext = nafha.media_url?.split(".").pop()?.split("?")[0] ?? "bin";
  const base =
    nafha.title
      .replace(/[\/:*?"<>|]+/g, " ")
      .trim()
      .slice(0, 60) || "nafha";
  return `${base}.${ext}`;
}
