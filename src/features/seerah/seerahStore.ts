"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "al-manara:seerah:v1";

const seerahSchema = z.object({
  /** The chapter and beat the reader was last on, for "continue where you stopped". */
  last: z.object({ event: z.string(), beat: z.number().int().min(0) }).nullable(),
  /** Chapters read to the end. */
  read: z.array(z.string()),
  /** Chapters whose questions were all answered. */
  badges: z.array(z.string()).default([]),
});

export type SeerahState = z.infer<typeof seerahSchema>;

const DEFAULT_STATE: SeerahState = { last: null, read: [], badges: [] };

let cached: SeerahState | undefined;
const listeners = new Set<() => void>();

function read(): SeerahState {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? seerahSchema.safeParse(JSON.parse(raw)) : null;
    cached = parsed?.success ? parsed.data : DEFAULT_STATE;
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

export function updateSeerah(change: (current: SeerahState) => SeerahState): void {
  cached = change(read());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Storage unavailable (private browsing) — progress lasts until the page closes.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSeerah(): SeerahState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
}
