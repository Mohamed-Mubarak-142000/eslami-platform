"use client";

import { useSyncExternalStore } from "react";

// One shared 1-second ticker for every clock/countdown on the page.
let current: Date | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      current = new Date();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): Date {
  if (!current) current = new Date();
  return current;
}

/** Current time, ticking every second. `null` during SSR/hydration so markup never mismatches. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
