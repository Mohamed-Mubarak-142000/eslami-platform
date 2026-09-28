"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Repeat2 } from "lucide-react";
import { useNow } from "@/features/time/useNow";
import { dualDate } from "@/features/calendar/format";
import { StarMark } from "@/components/ui/Ornament";

/** A wall tear-off calendar ("نتيجة") showing today in both calendars; tap to flip which leads. */
export function DeskCalendar() {
  const now = useNow();
  const [hijriFirst, setHijriFirst] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[19rem] [perspective:1400px]" data-hero-calendar>
      <div className="relative z-10 flex h-9 items-center justify-center gap-24 rounded-t-3xl bg-emerald-deep shadow-lift">
        <span className="relative -top-3 block h-7 w-3 rounded-full border-2 border-gold bg-emerald-night" aria-hidden />
        <span className="relative -top-3 block h-7 w-3 rounded-full border-2 border-gold bg-emerald-night" aria-hidden />
      </div>

      {/* The sheets underneath give the stack its depth. */}
      <div className="absolute inset-x-2 top-9 bottom-[-6px] rounded-b-3xl bg-ivory-deep shadow-soft" aria-hidden />
      <div className="absolute inset-x-1 top-9 bottom-[-3px] rounded-b-3xl bg-parchment" aria-hidden />

      <button
        type="button"
        onClick={() => setHijriFirst((value) => !value)}
        className="group relative block w-full text-start"
        aria-label={hijriFirst ? "اعرض التاريخ الميلادي أولًا" : "اعرض التاريخ الهجري أولًا"}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {now ? (
            <CalendarSheet key={`${now.toDateString()}-${hijriFirst}`} date={now} hijriFirst={hijriFirst} />
          ) : (
            <div className="h-[19.5rem] rounded-b-3xl bg-white" />
          )}
        </AnimatePresence>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-mist px-2.5 py-1 text-[0.7rem] font-bold text-emerald opacity-80 transition-opacity group-hover:opacity-100">
          <Repeat2 className="size-3.5" aria-hidden /> قلّب
        </span>
      </button>
    </div>
  );
}

function CalendarSheet({ date, hijriFirst }: { date: Date; hijriFirst: boolean }) {
  const d = dualDate(date);
  const primary = hijriFirst
    ? { day: d.hijriDay, month: d.hijriMonth, year: `${d.hijriYear} هـ`, label: "التقويم الهجري" }
    : { day: d.gregorianDay, month: d.gregorianMonth, year: `${d.gregorianYear} م`, label: "التقويم الميلادي" };
  const secondary = hijriFirst
    ? `${d.gregorianDay} ${d.gregorianMonth} ${d.gregorianYear} م`
    : `${d.hijriDay} ${d.hijriMonth} ${d.hijriYear} هـ`;

  return (
    <motion.div
      initial={{ rotateX: -95, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      exit={{ rotateX: 70, y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      style={{ transformOrigin: "top center" }}
      className="relative overflow-hidden rounded-b-3xl bg-white text-center text-ink shadow-lift"
    >
      <div className="border-b border-dashed border-line bg-gold-mist px-4 py-2.5 text-sm font-bold text-gold-deep">{d.weekday}</div>
      <div className="px-5 pb-6 pt-4">
        <p className="text-[0.7rem] font-bold tracking-wide text-muted">{primary.label}</p>
        <p className="font-display text-[6.5rem] font-bold leading-none text-emerald">{primary.day}</p>
        <p className="mt-1 font-display text-xl font-bold">{primary.month}</p>
        <p className="text-sm text-muted">{primary.year}</p>
        <div className="my-4 flex items-center gap-2" aria-hidden>
          <span className="h-px flex-1 bg-linear-to-l from-transparent via-gold/60 to-transparent" />
          <StarMark className="size-3.5 text-gold" />
          <span className="h-px flex-1 bg-linear-to-l from-transparent via-gold/60 to-transparent" />
        </div>
        <p className="text-sm font-bold text-gold-deep">{secondary}</p>
        {d.isRamadan && <p className="mt-2 inline-block rounded-full bg-emerald px-3 py-1 text-xs font-bold text-white">رمضان كريم</p>}
      </div>
    </motion.div>
  );
}
