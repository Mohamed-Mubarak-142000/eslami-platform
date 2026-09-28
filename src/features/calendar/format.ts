import { toArabicDigits } from "@/lib/arabic";
import { getHijriDate } from "./hijriDate";

const weekday = new Intl.DateTimeFormat("ar-EG", { weekday: "long" });
const monthName = new Intl.DateTimeFormat("ar-EG", { month: "long" });

export interface DualDate {
  weekday: string;
  gregorianDay: string;
  gregorianMonth: string;
  gregorianYear: string;
  hijriDay: string;
  hijriMonth: string;
  hijriYear: string;
  isRamadan: boolean;
}

export function dualDate(date: Date): DualDate {
  const hijri = getHijriDate(date);
  return {
    weekday: weekday.format(date),
    gregorianDay: toArabicDigits(date.getDate()),
    gregorianMonth: monthName.format(date),
    gregorianYear: toArabicDigits(date.getFullYear()),
    hijriDay: toArabicDigits(hijri.day),
    hijriMonth: hijri.monthName,
    hijriYear: toArabicDigits(hijri.year),
    isRamadan: hijri.isRamadan,
  };
}
