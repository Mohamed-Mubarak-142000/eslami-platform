"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Moon, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useNow } from "@/features/time/useNow";
import { DeskCalendar } from "@/features/home/DeskCalendar";
import { daysBetween, getNextRamadanStart } from "./hijriDate";
import { dualDate } from "./format";
import {
  gregorianMonthGrid,
  hijriMonthGrid,
  sameDay,
  shiftHijriMonth,
  upcomingOccasions,
  WEEKDAYS_SHORT,
  type CalendarCell,
} from "./calendarModel";

type Mode = "gregorian" | "hijri";

const monthTitle = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" });

export function CalendarView() {
  const now = useNow();
  const [mode, setMode] = useState<Mode>("gregorian");
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);
  const base = anchor ?? now;

  const view = useMemo(() => {
    if (!base) return null;
    if (mode === "gregorian") {
      return { title: monthTitle.format(base), subtitle: "", cells: gregorianMonthGrid(base.getFullYear(), base.getMonth()) };
    }
    const month = hijriMonthGrid(base);
    return {
      title: `${month.hijri.monthName} ${toArabicDigits(month.hijri.year)} هـ`,
      subtitle: `${toArabicDigits(month.days)} يومًا`,
      cells: month.cells,
    };
  }, [base, mode]);

  const dayKey = now ? now.toDateString() : null;
  const today = useMemo(() => (dayKey ? new Date(`${dayKey} 12:00`) : null), [dayKey]);
  const upcoming = useMemo(() => (today ? upcomingOccasions(today) : []), [today]);
  const ramadan = useMemo(() => {
    if (!today) return null;
    const next = getNextRamadanStart(today);
    return next ? daysBetween(today, next) : null;
  }, [today]);

  function shift(delta: 1 | -1) {
    if (!base) return;
    setDirection(delta);
    if (mode === "gregorian") setAnchor(new Date(base.getFullYear(), base.getMonth() + delta, 1, 12));
    else setAnchor(shiftHijriMonth(base, delta));
  }

  const focus = selected ?? now;
  const focusInfo = focus ? dualDate(focus) : null;
  const focusCell = focus && view ? view.cells.find((entry) => sameDay(entry.date, focus)) : undefined;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-line sm:p-7" aria-label="التقويم">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="نوع التقويم" className="flex rounded-full border border-line bg-ivory p-1">
            {(
              [
                ["gregorian", "ميلادي", Sun],
                ["hijri", "هجري", Moon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold",
                  mode === value ? "bg-emerald text-white" : "text-muted",
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="grid size-10 place-items-center rounded-full border border-line hover:border-emerald/40"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <div className="min-w-44 text-center">
              <h2 className="font-display text-xl font-bold text-emerald-deep">{view?.title ?? "…"}</h2>
              {view?.subtitle && <p className="text-xs text-muted">{view.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => shift(1)}
              className="grid size-10 place-items-center rounded-full border border-line hover:border-emerald/40"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setAnchor(null);
              setSelected(null);
            }}
            className="rounded-full bg-gold-mist px-3 py-1.5 text-xs font-bold text-gold-deep"
          >
            اليوم
          </button>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold text-muted sm:text-xs">
          {WEEKDAYS_SHORT.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            {view && (
              <motion.div
                key={`${mode}-${view.title}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * 60 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="grid grid-cols-7 gap-1"
              >
                {view.cells.map((entry) => (
                  <DayCell
                    key={entry.date.toISOString()}
                    cell={entry}
                    mode={mode}
                    today={now ? sameDay(entry.date, now) : false}
                    selected={selected ? sameDay(entry.date, selected) : false}
                    onSelect={() => setSelected(entry.date)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-xs text-muted">التواريخ الهجرية وفق تقويم أم القرى، وقد تختلف يومًا حسب رؤية الهلال في بلدك.</p>
      </section>

      <aside className="space-y-6">
        <DeskCalendar />
        {focusInfo && (
          <div className="rounded-[1.75rem] bg-white p-5 shadow-soft ring-1 ring-line">
            <p className="text-xs font-bold text-muted">{selected ? "اليوم المحدد" : "اليوم"}</p>
            <p className="mt-1 font-display text-lg font-bold text-emerald-deep">
              {focusInfo.weekday} {focusInfo.gregorianDay} {focusInfo.gregorianMonth} {focusInfo.gregorianYear}
            </p>
            <p className="text-sm font-bold text-gold-deep">
              {focusInfo.hijriDay} {focusInfo.hijriMonth} {focusInfo.hijriYear} هـ
            </p>
            {focusCell?.occasion && (
              <p className="mt-3 inline-flex rounded-full bg-emerald px-3 py-1 text-xs font-bold text-white">{focusCell.occasion.label}</p>
            )}
          </div>
        )}
        {ramadan !== null && (
          <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-emerald-night p-5 text-white shadow-lift">
            <div className="pattern-stars-light absolute inset-0 -z-10" aria-hidden />
            <Moon className="size-6 text-gold" aria-hidden />
            <p className="mt-2 text-sm text-white/70">يفصلنا عن رمضان تقريبًا</p>
            <p className="font-display text-4xl font-bold text-gold-soft">{toArabicDigits(ramadan)} يومًا</p>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="rounded-[1.75rem] bg-white p-5 shadow-soft ring-1 ring-line">
            <h3 className="inline-flex items-center gap-2 font-bold text-emerald-deep">
              <Sparkles className="size-4 text-gold" aria-hidden /> مناسبات قادمة
            </h3>
            <ul className="mt-3 space-y-2">
              {upcoming.map((entry) => (
                <li key={entry.occasion.label} className="flex items-center justify-between gap-3 rounded-2xl bg-ivory p-3 text-sm">
                  <span className="font-bold">{entry.occasion.label}</span>
                  <span className="text-xs text-muted">{entry.inDays === 0 ? "اليوم" : `بعد ${toArabicDigits(entry.inDays)} يومًا`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function DayCell({
  cell,
  mode,
  today,
  selected,
  onSelect,
}: {
  cell: CalendarCell;
  mode: Mode;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const primary = mode === "gregorian" ? cell.date.getDate() : cell.hijri.day;
  const secondary = mode === "gregorian" ? cell.hijri.day : cell.date.getDate();
  const isFriday = cell.date.getDay() === 5;
  const info = dualDate(cell.date);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${info.weekday} ${info.gregorianDay} ${info.gregorianMonth}، ${info.hijriDay} ${info.hijriMonth}${cell.occasion ? ` — ${cell.occasion.label}` : ""}`}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-center transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 sm:aspect-[1.1]",
        !cell.inMonth && "opacity-35",
        today
          ? "border-emerald bg-emerald text-white shadow-soft"
          : selected
            ? "border-gold bg-gold-mist"
            : "border-transparent bg-ivory hover:border-gold/50",
      )}
    >
      <span className={cn("font-display text-lg font-bold sm:text-2xl", !today && isFriday && "text-emerald")}>
        {toArabicDigits(primary)}
      </span>
      <span className={cn("text-[0.65rem] sm:text-xs", today ? "text-white/75" : "text-muted")}>{toArabicDigits(secondary)}</span>
      {cell.occasion && <span className={cn("absolute top-1.5 size-1.5 rounded-full", today ? "bg-gold-soft" : "bg-gold")} aria-hidden />}
    </button>
  );
}
