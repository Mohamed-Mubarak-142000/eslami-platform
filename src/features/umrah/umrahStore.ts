"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "al-manara:umrah:v1";

export const MIN_SCALE = 0.9;
export const MAX_SCALE = 1.4;

const umrahSchema = z.object({
  /** The step on screen, and the steps marked done. */
  step: z.string(),
  done: z.array(z.string()),
  /** Where the pilgrim sets out from, for the miqat. */
  origin: z.string(),
  /** Rounds finished, kept so a reload in the middle of tawaf or sa'i loses nothing. */
  tawaf: z.number().int().min(0).max(7),
  sai: z.number().int().min(0).max(7),
  /** Text size for reading on the move. */
  scale: z.number().min(MIN_SCALE).max(MAX_SCALE),
});

export type UmrahState = z.infer<typeof umrahSchema>;

const DEFAULT_STATE: UmrahState = { step: "prepare", done: [], origin: "egypt", tawaf: 0, sai: 0, scale: 1 };

let cached: UmrahState | undefined;
const listeners = new Set<() => void>();

function read(): UmrahState {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? umrahSchema.safeParse(JSON.parse(raw)) : null;
    cached = parsed?.success ? parsed.data : DEFAULT_STATE;
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

export function updateUmrah(change: (current: UmrahState) => UmrahState): void {
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

export function useUmrah(): UmrahState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
}
