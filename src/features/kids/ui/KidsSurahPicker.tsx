"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { getSurahAyahCount } from "../progress/surahAyahCounts";
import { kidsPanel } from "./kidsStyles";

interface KidsSurahPickerProps {
  surahs: Surah[];
  hrefBase: "/kids/learn" | "/kids/games/tajweed" | "/kids/games/arrange" | "/kids/progress";
  title: string;
  subtitle: string;
  showProgress?: boolean;
}

export function KidsSurahPicker({ surahs, hrefBase, title, subtitle, showProgress = true }: KidsSurahPickerProps) {
  const { state } = useKidsProgress();

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
          return (
            <motion.li
              key={surah.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(index * 0.03, 0.6), type: "spring", stiffness: 260, damping: 20 }}
            >
              <Link
                href={`${hrefBase}/${surah.id}` as Route}
                className="group flex h-full flex-col items-center rounded-[2rem] bg-white/95 p-4 text-center shadow-lift ring-4 ring-white/60 transition-transform hover:-translate-y-1.5"
              >
                <span className="relative grid size-16 place-items-center">
                  <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                    <circle cx="18" cy="18" r="15.5" fill={done ? "#12a15b" : "#eef7ee"} stroke="#e1efe3" strokeWidth="3" />
                    {showProgress && (
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
                  <span className={`relative text-xl font-extrabold ${done ? "text-white" : "text-emerald-deep"}`}>
                    {done ? <Check className="size-7" aria-hidden /> : toArabicDigits(surah.id)}
                  </span>
                </span>
                <span className="mt-2 text-xl font-extrabold text-emerald-deep">{surah.name}</span>
                <span className="text-xs font-bold text-muted">
                  {toArabicDigits(total)} آيات{showProgress && memorized > 0 ? ` · حفظت ${toArabicDigits(memorized)}` : ""}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
