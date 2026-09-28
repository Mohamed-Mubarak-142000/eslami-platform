"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { BookOpen, CalendarClock, Flame, Lock, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { BADGE_DEFINITIONS } from "./badges";
import { useKidsProgress } from "./KidsProgressProvider";
import { getDueReviews } from "./reviewSchedule";
import { computeStars, countMemorizedAyahs } from "./stars";
import { computeStreak } from "./streak";
import { getSurahAyahCount } from "./surahAyahCounts";

export function KidsProgress({ surahs }: { surahs: Surah[] }) {
  const { state } = useKidsProgress();
  const unlocked = new Set(state.unlockedBadgeIds);
  const due = getDueReviews(state.reviewSchedule);
  const names = new Map(surahs.map((surah) => [surah.id, surah.name]));
  const stats = [
    { label: "نجمة", value: computeStars(state), icon: Star, color: "#f5b92e" },
    { label: "آية محفوظة", value: countMemorizedAyahs(state), icon: BookOpen, color: "#12a15b" },
    { label: "أيام متتالية", value: computeStreak(state.activityDates), icon: Flame, color: "#f0642e" },
  ];

  return (
    <div className="space-y-6">
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">رحلتي وشاراتي</h1>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 16 }}
                className="rounded-3xl bg-ivory p-4"
              >
                <Icon className="mx-auto size-9" style={{ color: stat.color, fill: stat.color }} aria-hidden />
                <p className="mt-1 text-3xl font-extrabold text-emerald-deep">{toArabicDigits(stat.value)}</p>
                <p className="text-sm font-bold text-muted">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {due.length > 0 && (
        <div className={kidsPanel}>
          <h2 className="inline-flex items-center gap-2 text-2xl font-extrabold text-emerald-deep">
            <CalendarClock className="size-7 text-[#1f9be0]" aria-hidden /> حان وقت المراجعة
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {due.map((entry) => (
              <Link key={entry.surahId} href={`/kids/progress/${entry.surahId}` as Route} className={kidsButton("sky", "py-2 text-base")}>
                سورة {names.get(entry.surahId) ?? toArabicDigits(entry.surahId)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className={kidsPanel}>
        <h2 className="text-2xl font-extrabold text-emerald-deep">شاراتي</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const Icon = badge.icon;
            const has = unlocked.has(badge.id);
            return (
              <li
                key={badge.id}
                className={cn(
                  "rounded-3xl p-4 text-center ring-4 transition-colors",
                  has ? "bg-[#fff6d8] ring-[#f5c542]" : "bg-[#f3f5f1] ring-transparent",
                )}
              >
                <motion.span
                  animate={has ? { rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}
                  className={cn(
                    "mx-auto grid size-16 place-items-center rounded-full",
                    has ? "bg-[#f5b92e] text-white shadow-[0_5px_0_#c98f10]" : "bg-line text-muted",
                  )}
                >
                  {has ? <Icon className="size-8" aria-hidden /> : <Lock className="size-7" aria-hidden />}
                </motion.span>
                <p className="mt-3 font-extrabold text-emerald-deep">{badge.label}</p>
                <p className="text-xs text-muted">{badge.description}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={kidsPanel}>
        <h2 className="text-2xl font-extrabold text-emerald-deep">ما حفظته من السور</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {surahs.map((surah) => {
            const total = getSurahAyahCount(surah.id);
            const count = state.memorizedAyahsBySurah[surah.id]?.length ?? 0;
            return (
              <li key={surah.id}>
                <Link
                  href={`/kids/progress/${surah.id}` as Route}
                  className="flex items-center gap-3 rounded-3xl bg-ivory p-3 transition-transform hover:-translate-y-0.5"
                >
                  <span className="w-24 shrink-0 font-extrabold text-emerald-deep">{surah.name}</span>
                  <span className="h-4 flex-1 overflow-hidden rounded-full bg-white">
                    <motion.span
                      className="block h-full rounded-full bg-linear-to-l from-[#12a15b] to-[#8fd96b]"
                      initial={{ width: 0 }}
                      animate={{ width: `${total ? (count / total) * 100 : 0}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-center text-sm font-bold text-muted">
                    {toArabicDigits(count)}/{toArabicDigits(total)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
