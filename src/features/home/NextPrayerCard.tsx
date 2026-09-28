"use client";

import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { formatPrayerClock, getPrayerWindow } from "@/features/prayer/prayerTimesApi";
import { usePrayerDay } from "@/features/prayer/usePrayerDay";
import { LocationButton } from "@/features/prayer/LocationButton";
import { toArabicDigits, pad2 } from "@/lib/arabic";
import { LiveClock } from "./LiveClock";

function Countdown({ ms }: { ms: number }) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const text = `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`;
  return (
    <span className="font-display tabular-nums" dir="ltr">
      {toArabicDigits(text)}
    </span>
  );
}

export function NextPrayerCard() {
  const { location, now, state } = usePrayerDay();
  const span = state.status === "ready" && now ? getPrayerWindow(state.day.times, now) : null;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress =
    span && now
      ? Math.min(1, Math.max(0, (now.getTime() - span.previous.at.getTime()) / (span.next.at.getTime() - span.previous.at.getTime())))
      : 0;

  return (
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white shadow-lift backdrop-blur-xl" data-hero-card>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-soft">
          <MapPin className="size-3.5" aria-hidden /> {location?.label ?? "…"}
        </p>
        <p className="text-xs text-white/60">الوقت المحلي</p>
      </div>
      <LiveClock now={now} className="mt-2" />

      <div className="mt-5 flex items-center gap-4 rounded-3xl bg-emerald-night/60 p-4">
        <div className="relative size-24 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="7" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-1000"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-center font-display text-lg font-bold">
            {span ? span.next.label : "…"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white/60">الصلاة القادمة</p>
          {state.status === "ready" && span && now ? (
            <>
              <p className="mt-0.5 font-display text-2xl font-bold">
                {span.next.label}{" "}
                <span className="text-base text-gold-soft">{toArabicDigits(formatPrayerClock(state.day.times[span.next.key]))}</span>
              </p>
              <p className="mt-1 text-sm text-white/75">
                بعد <Countdown ms={span.next.at.getTime() - now.getTime()} />
              </p>
            </>
          ) : state.status === "error" ? (
            <p className="mt-1 text-sm text-white/75">تعذّر تحميل المواقيت الآن.</p>
          ) : (
            <p className="mt-1 text-sm text-white/60">جارٍ حساب المواقيت…</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {location?.source === "timezone" ? <LocationButton /> : <span />}
        <Link href="/prayer-times" className="inline-flex items-center gap-1 text-xs font-bold text-gold-soft hover:text-white">
          كل المواقيت <ChevronLeft className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
