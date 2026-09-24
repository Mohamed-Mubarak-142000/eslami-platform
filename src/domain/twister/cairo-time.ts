/**
 * Africa/Cairo wall-clock helpers shared by the hours/offer-window and order-ref logic.
 * `docs/product/business-rules.md` requires every time-of-day decision to use the Cairo
 * timezone regardless of the visitor's device, so this module never reads the local
 * environment's offset directly — it always goes through `Intl` with an explicit timeZone.
 */

export const CAIRO_TIME_ZONE = "Africa/Cairo";

export interface CairoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday .. 6 = Saturday, matching `WeeklyHours.weekday`. */
  weekday: number;
}

const weekdayIndex: Readonly<Record<string, number>> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const cairoFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CAIRO_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

/** Reads the Cairo-local calendar/clock fields for a given instant. */
export function cairoParts(instant: Date): CairoParts {
  const parts: Record<string, string> = {};
  for (const part of cairoFormatter.formatToParts(instant)) parts[part.type] = part.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdayIndex[parts.weekday ?? "Sun"] ?? 0,
  };
}

/** Cairo's current UTC offset (ms, positive east of UTC) at the given instant, DST-aware. */
export function cairoOffsetMs(instant: Date): number {
  const p = cairoParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant.getTime();
}

/** Converts a Cairo-local wall-clock time into the real UTC instant it represents. */
export function cairoWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second = 0): Date {
  const targetAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = cairoOffsetMs(new Date(targetAsUtcMs));
  return new Date(targetAsUtcMs - offset);
}
