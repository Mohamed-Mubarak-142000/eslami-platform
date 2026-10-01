import type { ReminderSlot } from "@/lib/supabase/database.types";
import { addDays, reminderDay } from "./dates";
import { OCCASIONS, type Occasion, type ReminderContext } from "./occasions";

export interface ScheduleSettings {
  hijriOffset: number;
  disabledOccasions: readonly string[];
}

export function reminderContext(date: string, hijriOffset: number): ReminderContext {
  return { today: reminderDay(date, hijriOffset), tomorrow: reminderDay(addDays(date, 1), hijriOffset) };
}

/**
 * The single occasion to email about on `date` in this slot, or null. One email per day at most:
 * when occasions coincide (Arafah on a Thursday eve), the highest priority wins.
 */
export function pickOccasion(date: string, slot: ReminderSlot, settings: ScheduleSettings): Occasion | null {
  const context = reminderContext(date, settings.hijriOffset);
  const matches = OCCASIONS.filter(
    (occasion) => occasion.slot === slot && !settings.disabledOccasions.includes(occasion.key) && occasion.matches(context),
  );
  return matches.sort((a, b) => b.priority - a.priority)[0] ?? null;
}

export interface ScheduledReminder {
  date: string;
  slot: ReminderSlot;
  occasion: Occasion;
}

/** What goes out over the next `days` days (disabled occasions included, for the admin list). */
export function upcomingReminders(from: string, days: number, hijriOffset: number): ScheduledReminder[] {
  const result: ScheduledReminder[] = [];
  for (let index = 0; index < days; index += 1) {
    const date = addDays(from, index);
    for (const slot of ["morning", "evening"] as const) {
      const occasion = pickOccasion(date, slot, { hijriOffset, disabledOccasions: [] });
      if (occasion) result.push({ date, slot, occasion });
    }
  }
  return result;
}
