/**
 * Calendar days for the reminder schedule, independent of the server's time zone (Vercel runs
 * in UTC). A day is a "YYYY-MM-DD" string in Cairo time; its Hijri date comes from Umm al-Qura,
 * shifted by the admin's offset when local moon sighting started the month a day early or late.
 */

export const REMINDER_TIME_ZONE = "Africa/Cairo";
const DAY_MS = 24 * 60 * 60 * 1000;

const localFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: REMINDER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  timeZone: "UTC",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { timeZone: "UTC", month: "long" });

export interface ReminderDay {
  /** "YYYY-MM-DD" in Cairo time. */
  date: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  hijri: { day: number; month: number; year: number; monthName: string };
}

/** Today's date in Cairo, e.g. "2026-10-09". */
export function localDate(now: Date = new Date()): string {
  return localFormatter.format(now);
}

export const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

/** Noon UTC, so adding whole days never crosses a date line. */
const noon = (date: string) => new Date(`${date}T12:00:00Z`);

export function addDays(date: string, days: number): string {
  return new Date(noon(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function reminderDay(date: string, hijriOffset = 0): ReminderDay {
  const civil = noon(date);
  const shifted = new Date(civil.getTime() + hijriOffset * DAY_MS);
  const parts = hijriFormatter.formatToParts(shifted);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value ?? "0");
  return {
    date,
    weekday: civil.getUTCDay(),
    hijri: { day: part("day"), month: part("month"), year: part("year"), monthName: monthFormatter.format(shifted) },
  };
}
