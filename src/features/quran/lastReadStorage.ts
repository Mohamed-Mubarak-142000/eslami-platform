"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "al-manara:quran-last-read:v2";

const lastReadSchema = z.object({
  surahId: z.number().int().min(1).max(114),
  surahName: z.string(),
  page: z.number().int().min(1).max(604),
  updatedAt: z.string(),
});

export type LastRead = z.infer<typeof lastReadSchema>;

let cached: LastRead | null | undefined;
const listeners = new Set<() => void>();

function read(): LastRead | null {
  if (cached !== undefined) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? lastReadSchema.safeParse(JSON.parse(raw)) : null;
    cached = parsed?.success ? parsed.data : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function saveLastRead(entry: Omit<LastRead, "updatedAt">): void {
  applyLastRead({ ...entry, updatedAt: new Date().toISOString() });
}

/** Stores an entry as-is (keeps its timestamp) — used when the account has a newer position. */
export function applyLastRead(next: LastRead): void {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private browsing) — resume simply won't be offered next visit.
  }
  listeners.forEach((notify) => notify());
}

/** Forgets the position on this device — used on sign-out so the next person doesn't see it. */
export function clearLastRead(): void {
  cached = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing was persisted.
  }
  listeners.forEach((notify) => notify());
}

export function readLastRead(): LastRead | null {
  return read();
}

export function subscribeLastRead(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLastRead(): LastRead | null {
  return useSyncExternalStore(subscribeLastRead, read, () => null);
}
