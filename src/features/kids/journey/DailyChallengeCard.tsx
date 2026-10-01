"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Check, Gift } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { useNow } from "@/features/time/useNow";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { buildDailyChallenge, DAILY_TASK_COUNT, todayKey, type DailyTaskId } from "../progress/dailyChallenge";
import { kidsButton } from "../ui/kidsStyles";

function taskHref(task: DailyTaskId, surahId: number | null): Route {
  if (surahId === null) return "/kids/games";
  switch (task) {
    case "listen":
      return `/kids/journey/${surahId}` as Route;
    case "learn":
      return `/kids/learn/${surahId}` as Route;
    case "quiz":
      return `/kids/quiz/${surahId}` as Route;
    case "recite":
      return `/kids/recite/${surahId}` as Route;
    case "play":
      return "/kids/games";
  }
}

export function DailyChallengeCard({ surahId }: { surahId: number | null }) {
  const { state } = useKidsProgress();
  const now = useNow();
  if (!now) return <div className="h-64 rounded-[2.5rem] bg-white/70" aria-hidden />;
  const day = todayKey(now);
  const tasks = buildDailyChallenge(day);
  const done = state.dailyDone[day] ?? [];
  const complete = done.length >= DAILY_TASK_COUNT;

  return (
    <section
      aria-labelledby="daily-title"
      className="rounded-[2.5rem] bg-linear-to-br from-[#fff6d8] to-[#ffe6a8] p-5 shadow-lift ring-4 ring-white/70 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="daily-title" className="text-2xl font-extrabold text-[#7a4b00]">
          🌟 تحدي اليوم
        </h2>
        <span className="rounded-full bg-white/80 px-3 py-1 text-base font-extrabold text-[#8a5a00]">
          {toArabicDigits(Math.min(done.length, DAILY_TASK_COUNT))} / {toArabicDigits(DAILY_TASK_COUNT)}
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {tasks.map((task) => {
          const finished = done.includes(task.id);
          return (
            <li key={task.id}>
              <Link
                href={taskHref(task.id, surahId)}
                className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-lg font-extrabold transition-transform hover:-translate-y-0.5 ${
                  finished ? "bg-[#d9f5e3] text-[#0b7a44]" : "bg-white text-emerald-deep"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {task.emoji}
                </span>
                <span className={finished ? "line-through decoration-2" : ""}>{task.title}</span>
                <span
                  className={`ms-auto grid size-8 shrink-0 place-items-center rounded-full ${finished ? "bg-[#12a15b] text-white" : "bg-[#f1ead6]"}`}
                >
                  {finished && <Check className="size-5" aria-label="تم" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {complete && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 text-center">
          <Link href={"/kids/rewards" as Route} className={kidsButton("rose")}>
            <Gift aria-hidden /> أحسنت! افتح صندوق اليوم
          </Link>
        </motion.div>
      )}
    </section>
  );
}
