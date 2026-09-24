import { z } from "zod";

const STORAGE_KEY = "al-manara:quran-last-read:v1";

const lastReadSchema = z.object({
  surahId: z.number().int().min(1).max(114),
  surahName: z.string(),
  updatedAt: z.string(),
});

export type LastRead = z.infer<typeof lastReadSchema>;

export function loadLastRead(): LastRead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = lastReadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveLastRead(surahId: number, surahName: string): void {
  if (typeof window === "undefined") return;
  try {
    const entry: LastRead = { surahId, surahName, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    cachedSnapshot = entry;
  } catch {
    // Storage full or unavailable (private browsing) — resume simply won't be offered.
  }
}

// Cached singleton snapshot so `useSyncExternalStore` (no cross-tab subscription needed —
// this only changes when this same session saves a new value) can return a stable reference.
let cachedSnapshot: LastRead | null | undefined;

export function getLastReadSnapshot(): LastRead | null {
  if (cachedSnapshot === undefined) cachedSnapshot = loadLastRead();
  return cachedSnapshot;
}

export function getServerLastReadSnapshot(): LastRead | null {
  return null;
}

export function subscribeLastRead(): () => void {
  return () => {};
}
