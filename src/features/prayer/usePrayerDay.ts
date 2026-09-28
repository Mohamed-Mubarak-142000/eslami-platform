"use client";

import { useEffect, useState } from "react";
import { useNow } from "@/features/time/useNow";
import { getPrayerDay, type PrayerDay } from "./prayerTimesApi";
import { locationKey, useUserLocation, type UserLocation } from "./location";

export type PrayerDayState = { status: "loading"; day: null } | { status: "error"; day: null } | { status: "ready"; day: PrayerDay };

const memory = new Map<string, PrayerDay>();

/** Today's prayer times for the visitor's (timezone-derived or chosen) location. */
export function usePrayerDay(): { location: UserLocation | null; now: Date | null; state: PrayerDayState } {
  const location = useUserLocation();
  const now = useNow();
  const [results, setResults] = useState<Record<string, PrayerDay | "error">>({});
  const key = location && now ? `${locationKey(location)}|${now.toDateString()}` : null;

  useEffect(() => {
    if (!location || !key || memory.has(key)) return;
    let cancelled = false;
    getPrayerDay(location).then((day) => {
      if (cancelled) return;
      if (day) memory.set(key, day);
      setResults((previous) => ({ ...previous, [key]: day ?? "error" }));
    });
    return () => {
      cancelled = true;
    };
    // `location` identity changes only when the stored location changes, which also changes `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const entry = key ? (memory.get(key) ?? results[key]) : undefined;
  const state: PrayerDayState =
    entry === undefined
      ? { status: "loading", day: null }
      : entry === "error"
        ? { status: "error", day: null }
        : { status: "ready", day: entry };
  return { location, now, state };
}
