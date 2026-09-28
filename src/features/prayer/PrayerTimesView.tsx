"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Loader2, MapPin, Moon, Sun, Sunrise, Sunset, CloudSun, SunDim } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits, pad2 } from "@/lib/arabic";
import { Reveal } from "@/components/ui/Reveal";
import { getHijriDate } from "@/features/calendar/hijriDate";
import { LiveClock } from "@/features/home/LiveClock";
import { CITY_CHOICES, chooseCity, type UserLocation } from "./location";
import { LocationButton } from "./LocationButton";
import { usePrayerDay } from "./usePrayerDay";
import {
  formatPrayerClock,
  getCurrentPrayerKey,
  getPrayerMonth,
  getPrayerWindow,
  PRAYER_LABELS,
  PRAYER_ORDER,
  type PrayerKey,
  type PrayerMonthDay,
} from "./prayerTimesApi";
import { QiblaCompass } from "./QiblaCompass";

const ICONS: Record<PrayerKey, LucideIcon> = { fajr: SunDim, sunrise: Sunrise, dhuhr: Sun, asr: CloudSun, maghrib: Sunset, isha: Moon };

function Countdown({ ms }: { ms: number }) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return (
    <span dir="ltr" className="tabular-nums">
      {toArabicDigits(`${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`)}
    </span>
  );
}

export function PrayerTimesView() {
  const { location, now, state } = usePrayerDay();
  const day = state.status === "ready" ? state.day : null;
  const span = day && now ? getPrayerWindow(day.times, now) : null;
  const currentKey = day && now ? getCurrentPrayerKey(day.times, now) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative z-10 -mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section
          className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-night p-6 text-white shadow-lift sm:p-8"
          aria-label="الصلاة القادمة"
        >
          <div className="pattern-stars-light absolute inset-0 -z-10" aria-hidden />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-soft">
                <MapPin className="size-4" aria-hidden /> {location?.label ?? "…"}
              </p>
              <LiveClock now={now} className="mt-3" />
            </div>
            <div className="text-end">
              <p className="text-xs text-white/60">الصلاة القادمة</p>
              <p className="font-display text-4xl font-bold text-gold-soft">{span?.next.label ?? "…"}</p>
              {span && now && day && (
                <p className="mt-1 text-sm text-white/75">
                  {toArabicDigits(formatPrayerClock(day.times[span.next.key]))} · بعد{" "}
                  <Countdown ms={span.next.at.getTime() - now.getTime()} />
                </p>
              )}
            </div>
          </div>

          {state.status === "loading" && (
            <p className="mt-8 inline-flex items-center gap-2 text-white/70">
              <Loader2 className="size-4 animate-spin" aria-hidden /> جارٍ حساب المواقيت…
            </p>
          )}
          {state.status === "error" && (
            <p className="mt-8 text-white/80">تعذّر تحميل المواقيت الآن. تحقّق من الاتصال أو اختر مدينة أخرى.</p>
          )}

          {day && now && (
            <ol className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PRAYER_ORDER.map((key) => {
                const Icon = ICONS[key];
                const isNext = span?.next.key === key;
                const isCurrent = currentKey === key;
                return (
                  <motion.li
                    key={key}
                    layout
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 transition-colors",
                      isNext
                        ? "border-gold bg-gold text-emerald-night"
                        : isCurrent
                          ? "border-white/30 bg-white/15"
                          : "border-white/10 bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-xl",
                        isNext ? "bg-emerald-night/10" : "bg-white/10 text-gold-soft",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold">{PRAYER_LABELS[key]}</span>
                      <span className={cn("block text-xs", isNext ? "text-emerald-night/70" : "text-white/60")}>
                        {isNext ? "القادمة" : isCurrent ? "الوقت الحالي" : key === "sunrise" ? "ليست صلاة" : ""}
                      </span>
                    </span>
                    <span className="font-display text-lg font-bold">{toArabicDigits(formatPrayerClock(day.times[key]))}</span>
                  </motion.li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <LocationButton />
            <label className="inline-flex items-center gap-2 text-xs text-white/70">
              أو اختر مدينة:
              <select
                value={location?.source === "timezone" ? location.city : ""}
                onChange={(event) => chooseCity(event.target.value)}
                className="rounded-full bg-white/10 px-3 py-1.5 font-bold text-white outline-none [&>option]:text-ink"
              >
                {location?.source === "geo" && <option value="">موقعك الحالي</option>}
                {CITY_CHOICES.map((choice) => (
                  <option key={choice.city} value={choice.city}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-white/50">
            طريقة الحساب: الهيئة المصرية العامة للمساحة. قد تختلف المواقيت دقائق قليلة عن التقويم المعتمد في بلدك.
          </p>
        </section>

        <QiblaCompass latitude={day?.latitude ?? null} longitude={day?.longitude ?? null} />
      </div>

      <MonthTable location={location} now={now} />
    </div>
  );
}

function MonthTable({ location, now }: { location: UserLocation | null; now: Date | null }) {
  const [rows, setRows] = useState<PrayerMonthDay[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!location || !now) return;
    setLoading(true);
    const data = await getPrayerMonth(location, now.getFullYear(), now.getMonth() + 1);
    setRows(data);
    setLoading(false);
  }

  const monthName = now ? new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(now) : "";

  return (
    <Reveal as="section" className="mt-10 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-deep">
            <CalendarRange className="size-6 text-gold" aria-hidden /> مواقيت الشهر
          </h2>
          <p className="mt-1 text-sm text-muted">{monthName}</p>
        </div>
        {!rows && (
          <button
            type="button"
            onClick={load}
            disabled={loading || !location}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald px-5 text-sm font-bold text-white hover:bg-emerald-deep"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden />} اعرض جدول الشهر
          </button>
        )}
      </div>
      {rows && rows.length === 0 && <p className="mt-6 text-muted">تعذّر تحميل جدول الشهر الآن.</p>}
      {rows && rows.length > 0 && now && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-y-1 text-center text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="p-2 text-start font-bold">اليوم</th>
                {PRAYER_ORDER.map((key) => (
                  <th key={key} className="p-2 font-bold">
                    {PRAYER_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isToday = row.day === now.getDate();
                const hijri = getHijriDate(new Date(now.getFullYear(), now.getMonth(), row.day));
                return (
                  <tr key={row.day} className={cn(isToday ? "bg-gold-mist font-bold text-emerald-deep" : "odd:bg-ivory")}>
                    <td className="rounded-s-xl p-2 text-start">
                      {toArabicDigits(row.day)}{" "}
                      <span className="text-xs text-muted">
                        · {toArabicDigits(hijri.day)} {hijri.monthName}
                      </span>
                    </td>
                    {PRAYER_ORDER.map((key, index) => (
                      <td key={key} className={cn("p-2 tabular-nums", index === PRAYER_ORDER.length - 1 && "rounded-e-xl")}>
                        {toArabicDigits(formatPrayerClock(row.times[key]))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Reveal>
  );
}
