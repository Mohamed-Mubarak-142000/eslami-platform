"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { PRESET_ADHKAR, TASBIH_THEMES, type Dhikr, type TasbihThemeId } from "./tasbihData";

const STORAGE_KEY = "al-manara:tasbih:v1";

const THEME_IDS = TASBIH_THEMES.map((theme) => theme.id) as [TasbihThemeId, ...TasbihThemeId[]];

const tasbihSchema = z.object({
  dhikrId: z.string(),
  /** Per dhikr: the count in the current round, the finished rounds, and the chosen target. */
  sessions: z.record(
    z.string(),
    z.object({ count: z.number().int().min(0), rounds: z.number().int().min(0), target: z.number().int().min(0) }),
  ),
  custom: z.array(z.object({ id: z.string(), text: z.string().min(1).max(300), target: z.number().int().min(0) })).max(50),
  theme: z.enum(THEME_IDS),
  vibrate: z.boolean(),
  sound: z.boolean(),
  /** Every tap ever, and today's taps (reset when the local date changes). */
  total: z.number().int().min(0),
  today: z.object({ date: z.string(), count: z.number().int().min(0) }),
});

export type TasbihState = z.infer<typeof tasbihSchema>;

const DEFAULT_STATE: TasbihState = {
  dhikrId: PRESET_ADHKAR[0]!.id,
  sessions: {},
  custom: [],
  theme: "emerald",
  vibrate: true,
  sound: false,
  total: 0,
  today: { date: "", count: 0 },
};

let cached: TasbihState | undefined;
const listeners = new Set<() => void>();

function read(): TasbihState {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? tasbihSchema.safeParse(JSON.parse(raw)) : null;
    cached = parsed?.success ? parsed.data : DEFAULT_STATE;
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

export function updateTasbih(change: (current: TasbihState) => TasbihState): void {
  cached = change(read());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Storage unavailable (private browsing) — the count lasts until the page closes.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTasbih(): TasbihState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function allAdhkar(state: TasbihState): Dhikr[] {
  return [...state.custom, ...PRESET_ADHKAR];
}

export function currentDhikr(state: TasbihState): Dhikr {
  const list = allAdhkar(state);
  return list.find((dhikr) => dhikr.id === state.dhikrId) ?? list[list.length - PRESET_ADHKAR.length]!;
}

export function sessionOf(state: TasbihState, dhikr: Dhikr) {
  return state.sessions[dhikr.id] ?? { count: 0, rounds: 0, target: dhikr.target };
}

/** Counts one tap; returns true when it completes a round. */
export function countTap(): boolean {
  let completed = false;
  updateTasbih((state) => {
    const dhikr = currentDhikr(state);
    const session = sessionOf(state, dhikr);
    const count = session.count + 1;
    completed = session.target > 0 && count >= session.target;
    const today = localDate();
    return {
      ...state,
      sessions: {
        ...state.sessions,
        [dhikr.id]: { ...session, count: completed ? 0 : count, rounds: session.rounds + (completed ? 1 : 0) },
      },
      total: state.total + 1,
      today: { date: today, count: (state.today.date === today ? state.today.count : 0) + 1 },
    };
  });
  return completed;
}
