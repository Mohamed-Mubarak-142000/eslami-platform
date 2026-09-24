import { cairoParts, cairoWallTimeToUtc } from "./cairo-time";
import type { Offer, OfferStatus, WeeklyHours } from "./schemas";

export interface OpenNowResult {
  isOpen: boolean;
  /** "HH:MM" Cairo-local time of the next opening, present only when closed and known. */
  opensAt?: string;
}

function toMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

/**
 * PROD-BR-01: the reference clock is always Africa/Cairo. A window whose `closesAt` is not
 * strictly after `opensAt` is treated as crossing midnight (e.g. 13:00 -> 02:00).
 */
export function isOpenNow(hours: readonly WeeklyHours[], now: Date = new Date()): OpenNowResult {
  const nowParts = cairoParts(now);
  const nowMinutes = nowParts.hour * 60 + nowParts.minute;
  const today = hours.find((entry) => entry.weekday === nowParts.weekday);
  const yesterdayWeekday = (nowParts.weekday + 6) % 7;
  const yesterday = hours.find((entry) => entry.weekday === yesterdayWeekday);

  if (today) {
    const openMinutes = toMinutes(today.opensAt);
    const closeMinutes = toMinutes(today.closesAt);
    const crossesMidnight = closeMinutes <= openMinutes;
    if (!crossesMidnight && nowMinutes >= openMinutes && nowMinutes < closeMinutes) return { isOpen: true };
    if (crossesMidnight && nowMinutes >= openMinutes) return { isOpen: true };
  }
  if (yesterday) {
    const yOpenMinutes = toMinutes(yesterday.opensAt);
    const yCloseMinutes = toMinutes(yesterday.closesAt);
    if (yCloseMinutes <= yOpenMinutes && nowMinutes < yCloseMinutes) return { isOpen: true };
  }

  for (let offset = 0; offset <= 7; offset += 1) {
    const weekday = (nowParts.weekday + offset) % 7;
    const entry = hours.find((candidate) => candidate.weekday === weekday);
    if (!entry) continue;
    const openMinutes = toMinutes(entry.opensAt);
    if (offset === 0 && openMinutes <= nowMinutes) continue;
    return { isOpen: false, opensAt: entry.opensAt };
  }
  return { isOpen: false };
}

/** The Cairo-local Thursday 00:00–23:59:59 window relevant to `now` (past-most-recent or upcoming). */
function thursdayWindow(now: Date): { start: Date; end: Date } {
  const THURSDAY = 4;
  const parts = cairoParts(now);
  const daysUntilThursday = (THURSDAY - parts.weekday + 7) % 7;
  const targetInstant = daysUntilThursday === 0 ? now : new Date(now.getTime() + daysUntilThursday * 86_400_000);
  const targetParts = cairoParts(targetInstant);
  return {
    start: cairoWallTimeToUtc(targetParts.year, targetParts.month, targetParts.day, 0, 0, 0),
    end: cairoWallTimeToUtc(targetParts.year, targetParts.month, targetParts.day, 23, 59, 59),
  };
}

/**
 * PROD-OFF-01: `weekly-thursday` offers recur forever, so they are only ever `active` (during
 * the Thursday window) or `scheduled` (counting down to it) — never `expired`. Non-recurring
 * offers use `startAt`/`endAt` literally.
 */
export function offerStatus(offer: Offer, now: Date = new Date()): OfferStatus {
  if (offer.recurrence === "weekly-thursday") {
    const { start, end } = thursdayWindow(now);
    if (now >= start && now <= end) return "active";
    return "scheduled";
  }
  const start = new Date(offer.startAt);
  const end = new Date(offer.endAt);
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  return "active";
}
