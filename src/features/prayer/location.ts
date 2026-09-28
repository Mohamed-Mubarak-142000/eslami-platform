"use client";

import { useSyncExternalStore } from "react";

export interface UserLocation {
  source: "timezone" | "geo";
  label: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

const STORAGE_KEY = "al-manara:location:v1";

// Timezone → nearest major city, so prayer times work before (or without) geolocation consent.
const TIMEZONE_CITIES: Record<string, Omit<UserLocation, "source">> = {
  "Africa/Cairo": { label: "القاهرة", city: "Cairo", country: "Egypt" },
  "Asia/Riyadh": { label: "الرياض", city: "Riyadh", country: "Saudi Arabia" },
  "Asia/Dubai": { label: "دبي", city: "Dubai", country: "United Arab Emirates" },
  "Asia/Kuwait": { label: "الكويت", city: "Kuwait City", country: "Kuwait" },
  "Asia/Qatar": { label: "الدوحة", city: "Doha", country: "Qatar" },
  "Asia/Bahrain": { label: "المنامة", city: "Manama", country: "Bahrain" },
  "Asia/Muscat": { label: "مسقط", city: "Muscat", country: "Oman" },
  "Asia/Amman": { label: "عمّان", city: "Amman", country: "Jordan" },
  "Asia/Baghdad": { label: "بغداد", city: "Baghdad", country: "Iraq" },
  "Asia/Beirut": { label: "بيروت", city: "Beirut", country: "Lebanon" },
  "Asia/Damascus": { label: "دمشق", city: "Damascus", country: "Syria" },
  "Asia/Gaza": { label: "غزة", city: "Gaza", country: "Palestine" },
  "Asia/Hebron": { label: "الخليل", city: "Hebron", country: "Palestine" },
  "Asia/Aden": { label: "عدن", city: "Aden", country: "Yemen" },
  "Africa/Khartoum": { label: "الخرطوم", city: "Khartoum", country: "Sudan" },
  "Africa/Tripoli": { label: "طرابلس", city: "Tripoli", country: "Libya" },
  "Africa/Tunis": { label: "تونس", city: "Tunis", country: "Tunisia" },
  "Africa/Algiers": { label: "الجزائر", city: "Algiers", country: "Algeria" },
  "Africa/Casablanca": { label: "الدار البيضاء", city: "Casablanca", country: "Morocco" },
  "Africa/Nouakchott": { label: "نواكشوط", city: "Nouakchott", country: "Mauritania" },
  "Europe/Istanbul": { label: "إسطنبول", city: "Istanbul", country: "Turkey" },
  "Europe/London": { label: "لندن", city: "London", country: "United Kingdom" },
  "Europe/Paris": { label: "باريس", city: "Paris", country: "France" },
  "Europe/Berlin": { label: "برلين", city: "Berlin", country: "Germany" },
  "America/New_York": { label: "نيويورك", city: "New York", country: "United States" },
};

const FALLBACK = TIMEZONE_CITIES["Africa/Cairo"]!;

function fromTimezone(): UserLocation {
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Older browsers: fall back to Cairo.
  }
  return { source: "timezone", ...(TIMEZONE_CITIES[zone] ?? FALLBACK) };
}

let cached: UserLocation | null = null;
const listeners = new Set<() => void>();

function read(): UserLocation {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserLocation;
      if (typeof parsed.label === "string" && typeof parsed.city === "string") {
        cached = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt or unavailable storage.
  }
  cached = fromTimezone();
  return cached;
}

function write(location: UserLocation) {
  cached = location;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Unavailable storage: keep the in-memory value only.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUserLocation(): UserLocation | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export type GeolocateResult = "ok" | "denied" | "unsupported" | "error";

/** Explicit, user-initiated geolocation; the result is remembered on this device. */
export function requestPreciseLocation(): Promise<GeolocateResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const base = read();
        write({
          source: "geo",
          label: "موقعك الحالي",
          city: base.city,
          country: base.country,
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
        });
        resolve("ok");
      },
      (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "error"),
      { timeout: 12_000, maximumAge: 60 * 60 * 1000 },
    );
  });
}

export function resetToTimezoneLocation() {
  write(fromTimezone());
}

export const CITY_CHOICES: readonly Omit<UserLocation, "source">[] = Object.values(TIMEZONE_CITIES);

export function chooseCity(city: string) {
  const choice = CITY_CHOICES.find((entry) => entry.city === city);
  if (choice) write({ source: "timezone", ...choice });
}

export function locationKey(location: UserLocation): string {
  return location.latitude !== undefined ? `${location.latitude},${location.longitude}` : `${location.city},${location.country}`;
}
