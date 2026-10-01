"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { getSurahAyahCount } from "../progress/surahAyahCounts";
import { levelStatus } from "../progress/levels";
import { kidsPanel } from "./kidsStyles";

interface KidsSurahPickerProps {
  surahs: Surah[];
  hrefBase:
    | "/kids/learn"
    | "/kids/quiz"
    | "/kids/games/tajweed"
    | "/kids/games/arrange"
    | "/kids/games/listen-pick"
    | "/kids/games/ayah-order"
    | "/kids/recite"
    | "/kids/progress";
  title: string;
  subtitle: string;
  showProgress?: boolean;
  /** Surahs are levels: a surah stays locked until the quiz of the one before it is passed. */
  levels?: boolean;
}

export function KidsSurahPicker({ surahs, hrefBase, title, subtitle, showProgress = true, levels = false }: KidsSurahPickerProps) {
  const { state, status } = useKidsProgress();

  return (
    <div>
      <div className={`${kidsPanel} mb-6 text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">{title}</h1>
        <p className="mt-2 text-lg text-muted">{subtitle}</p>
      </div>
      {surahs.length === 0 && <p className={`${kidsPanel} text-center text-muted`}>تعذّر تحميل السور الآن، جرّب بعد قليل.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {surahs.map((surah, index) => {
          const total = getSurahAyahCount(surah.id);
          const memorized = state.memorizedAyahsBySurah[surah.id]?.length ?? 0;
          const percent = total ? memorized / total : 0;
          const done = percent >= 1;
          const level = levels ? levelStatus(state, surah.id) : null;
          const locked = level === "locked" || (levels && status === "loading");
          const content = (
            <>
              <span className="relative grid size-16 place-items-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill={locked ? "#eef1ec" : done ? "#12a15b" : "#eef7ee"}
                    stroke="#e1efe3"
                    strokeWidth="3"
                  />
                  {showProgress && !locked && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#f5b92e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={97.4}
                      strokeDashoffset={97.4 * (1 - percent)}
                    />
                  )}
                </svg>
                <span className={`relative text-xl font-extrabold ${done && !locked ? "text-white" : "text-emerald-deep"}`}>
                  {locked ? (
                    <Lock className="size-6 text-muted" aria-hidden />
                  ) : done ? (
                    <Check className="size-7" aria-hidden />
                  ) : (
                    toArabicDigits(surah.id)
                  )}
                </span>
                {level === "passed" && (
                  <Star className="absolute -right-1 -top-1 size-6 fill-[#f5c542] text-[#e0a800]" aria-label="نجحت في اختبارها" />
                )}
              </span>
              <span className="mt-2 text-xl font-extrabold text-emerald-deep">{surah.name}</span>
              <span className="text-xs font-bold text-muted">
                {locked
                  ? "انجح في اختبار السورة السابقة لتفتحها"
                  : `${toArabicDigits(total)} آيات${showProgress && memorized > 0 ? ` · حفظت ${toArabicDigits(memorized)}` : ""}`}
              </span>
            </>
          );
          const cardClass = "group flex h-full flex-col items-center rounded-[2rem] p-4 text-center shadow-lift ring-4";
          return (
            <motion.li
              key={surah.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(index * 0.03, 0.6), type: "spring", stiffness: 260, damping: 20 }}
            >
              {locked ? (
                <div aria-disabled className={cn(cardClass, "bg-white/70 opacity-75 ring-white/40")}>
                  {content}
                </div>
              ) : (
                <Link
                  href={`${hrefBase}/${surah.id}` as Route}
                  className={cn(cardClass, "bg-white/95 ring-white/60 transition-transform hover:-translate-y-1.5")}
                >
                  {content}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
