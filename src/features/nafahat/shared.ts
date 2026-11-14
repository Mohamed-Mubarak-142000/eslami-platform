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

/** localStorage key: the id of the latest nafha the visitor has already been shown. */
export const LAST_SEEN_KEY = "nafahat:lastSeen";

const DATE = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
export const formatNafhaDate = (iso: string) => DATE.format(new Date(iso));

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
