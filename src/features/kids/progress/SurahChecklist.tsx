"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { BookOpen, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { useKidsProgress } from "./KidsProgressProvider";
import { getDueReviews } from "./reviewSchedule";

export function SurahChecklist({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const { state, setAyahMemorized, markSurahReviewed } = useKidsProgress();
  const memorized = new Set(state.memorizedAyahsBySurah[surah.id] ?? []);
  const isDue = getDueReviews(state.reviewSchedule).some((entry) => entry.surahId === surah.id);

  return (
    <div className="space-y-6">
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep">سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">
          حفظت {toArabicDigits(memorized.size)} من {toArabicDigits(ayahs.length)} آيات — اضغط على الآية التي حفظتها
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/kids/learn/${surah.id}` as Route} className={kidsButton("emerald", "text-base")}>
            <BookOpen aria-hidden /> تعلّم السورة
          </Link>
          {isDue && (
            <button
              type="button"
              onClick={() => {
                markSurahReviewed(surah.id);
                sfx.correct();
              }}
              className={kidsButton("sky", "text-base")}
            >
              <RefreshCw aria-hidden /> راجعتها اليوم
            </button>
          )}
        </div>
      </div>
      <ul className="space-y-3">
        {ayahs.map((ayah) => {
          const done = memorized.has(ayah.numberInSurah);
          return (
            <li key={ayah.number}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setAyahMemorized(surah.id, ayah.numberInSurah, !done);
                  if (!done) sfx.correct();
                }}
                aria-pressed={done}
                className={cn(
                  "flex w-full items-center gap-4 rounded-[2rem] p-4 text-start shadow-lift ring-4 transition-colors",
                  done ? "bg-[#eafbf1] ring-[#12a15b]" : "bg-white/95 ring-white/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold",
                    done ? "bg-[#12a15b] text-white" : "bg-[#eef1ec] text-muted",
                  )}
                >
                  {done ? <Check className="size-6" aria-hidden /> : toArabicDigits(ayah.numberInSurah)}
                </span>
                <span className="quran-text flex-1 text-2xl leading-[1.9] text-[#1b2a24]">{ayah.text}</span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
