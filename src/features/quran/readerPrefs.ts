"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import type { RiwayaKey } from "./riwayat";

export type ReaderTheme = "light" | "sepia" | "night" | "emerald" | "dusk";

interface ThemeColors {
  label: string;
  shell: string;
  page: string;
  ink: string;
  frame: string;
  accent: string;
}

/** Same values as the mobile app (features/mushaf/readerPrefs.ts there). */
export const READER_THEMES: Record<ReaderTheme, ThemeColors> = {
  light: { label: "فاتح", shell: "#fbf8f1", page: "#fffdf7", ink: "#1b2a24", frame: "#f1e7cc", accent: "#9c7a26" },
  sepia: { label: "دافئ", shell: "#eadcb9", page: "#f6ead0", ink: "#3b2f1b", frame: "#e2cf9e", accent: "#8a6a1f" },
  night: { label: "ليلي", shell: "#06110d", page: "#0d1d18", ink: "#ebe5d1", frame: "#132b24", accent: "#d9b35a" },
  emerald: { label: "زمردي", shell: "#e3eee9", page: "#f2f8f5", ink: "#12302a", frame: "#cfe3da", accent: "#005544" },
  dusk: { label: "غسقي", shell: "#16121f", page: "#1e1a2b", ink: "#ece6f5", frame: "#2b2540", accent: "#d9b35a" },
};

/** Page colours that come with supporting the site (cosmetic only). */
export const SUPPORTER_THEMES: readonly ReaderTheme[] = ["emerald", "dusk"];

export function themeStyle(theme: ReaderTheme): CSSProperties {
  const colors = READER_THEMES[theme];
  return {
    background: colors.shell,
    color: colors.ink,
    "--page-bg": colors.page,
    "--page-ink": colors.ink,
    "--frame-bg": colors.frame,
    "--page-accent": colors.accent,
  } as CSSProperties;
}

/** Largest text size per step, in px; small screens scale it down with the viewport. */
export const FONT_STEPS = [22, 26, 30, 35, 41] as const;
/** At this step and below the page shrinks to fit the screen whole, like a printed page; larger ones scroll. */
export const DEFAULT_FONT_STEP = 2;

export interface ReaderPrefs {
  theme: ReaderTheme;
  fontStep: number;
  tajweed: boolean;
}

export interface PageBookmark {
  riwaya: RiwayaKey;
  page: number;
  surahName: string;
  savedAt: number;
}

const PREFS_KEY = "al-manara:mushaf-prefs:v1";
const BOOKMARKS_KEY = "al-manara:mushaf-bookmarks:v1";
const DEFAULT_PREFS: ReaderPrefs = { theme: "light", fontStep: DEFAULT_FONT_STEP, tajweed: true };
const NO_BOOKMARKS: PageBookmark[] = [];

function createStore<T>(key: string, fallback: T, valid: (value: unknown) => T | null) {
  let cached: T | undefined;
  const listeners = new Set<() => void>();
  const read = (): T => {
    if (cached !== undefined) return cached;
    try {
      const raw = window.localStorage.getItem(key);
      cached = (raw ? valid(JSON.parse(raw)) : null) ?? fallback;
    } catch {
      cached = fallback;
    }
    return cached;
  };
  const write = (next: T) => {
    cached = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private browsing: the choice still holds for this visit.
    }
    listeners.forEach((notify) => notify());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return { read, write, subscribe, server: () => fallback };
}

const prefsStore = createStore<ReaderPrefs>(PREFS_KEY, DEFAULT_PREFS, (value) => {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<ReaderPrefs>;
  return {
    theme: v.theme && v.theme in READER_THEMES ? v.theme : DEFAULT_PREFS.theme,
    fontStep: Number.isInteger(v.fontStep) && v.fontStep! >= 0 && v.fontStep! < FONT_STEPS.length ? v.fontStep! : DEFAULT_PREFS.fontStep,
    tajweed: typeof v.tajweed === "boolean" ? v.tajweed : DEFAULT_PREFS.tajweed,
  };
});

const bookmarksStore = createStore<PageBookmark[]>(BOOKMARKS_KEY, NO_BOOKMARKS, (value) =>
  Array.isArray(value)
    ? (value.filter((entry) => Number.isInteger(entry?.page) && typeof entry?.riwaya === "string") as PageBookmark[])
    : null,
);

export function useReaderPrefs(): ReaderPrefs {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.read, prefsStore.server);
}

export function setReaderPrefs(change: Partial<ReaderPrefs>) {
  prefsStore.write({ ...prefsStore.read(), ...change });
}

export function useBookmarks(): PageBookmark[] {
  return useSyncExternalStore(bookmarksStore.subscribe, bookmarksStore.read, bookmarksStore.server);
}

/** Adds the page, or removes it when it's already bookmarked. Newest first. */
export function toggleBookmark(entry: Omit<PageBookmark, "savedAt">) {
  const list = bookmarksStore.read();
  const exists = list.some((item) => item.riwaya === entry.riwaya && item.page === entry.page);
  bookmarksStore.write(
    exists
      ? list.filter((item) => !(item.riwaya === entry.riwaya && item.page === entry.page))
      : [{ ...entry, savedAt: Date.now() }, ...list].slice(0, 100),
  );
}
