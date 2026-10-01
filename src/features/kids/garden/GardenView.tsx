"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Check, Lock, ShoppingBag } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { countDoneStations } from "../progress/journey";
import { ownedItemIds } from "../progress/rewards";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { GARDEN_STAGES, nextGardenStage } from "./garden";
import { GardenScene } from "./GardenScene";

export function GardenView() {
  const { state } = useKidsProgress();
  const done = countDoneStations(state);
  const next = nextGardenStage(done);
  const previous = [...GARDEN_STAGES].reverse().find((stage) => stage.stations <= done)?.stations ?? 0;
  const toNext = next ? Math.round(((done - previous) / (next.stations - previous)) * 100) : 100;

  return (
    <div className="mx-auto max-w-4xl">
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">🌳 حديقتي</h1>
        <p className="mt-2 text-lg text-muted">كل محطة تُكملها في الرحلة تزرع شيئًا جديدًا في حديقتك!</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 overflow-hidden rounded-[2.5rem] shadow-lift ring-4 ring-white/80"
      >
        <GardenScene doneStations={done} ownedItems={[...ownedItemIds(state)]} />
      </motion.div>

      {next ? (
        <div className={`${kidsPanel} mt-6`}>
          <p className="text-center text-xl font-extrabold text-emerald-deep">
            {next.emoji} القادم: {next.name}. أكمل {toArabicDigits(next.stations - done)}{" "}
            {next.stations - done === 1 ? "محطة واحدة" : "محطات"} لتظهر في حديقتك
          </p>
          <div
            className="mt-3 h-5 overflow-hidden rounded-full bg-[#e9efe9]"
            role="progressbar"
            aria-valuenow={toNext}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-linear-to-l from-[#12a15b] to-[#7bd389]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(toNext, 4)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      ) : (
        <p className={`${kidsPanel} mt-6 text-center text-2xl font-extrabold text-emerald-deep`}>🕌 ما شاء الله! اكتملت حديقتك</p>
      )}

      <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {GARDEN_STAGES.map((stage) => {
          const open = done >= stage.stations;
          return (
            <li
              key={stage.id}
              className={`relative rounded-3xl p-3 text-center shadow-lift ring-4 ${open ? "bg-white ring-[#bfe8cd]" : "bg-white/70 ring-white/50"}`}
            >
              <span className={`block text-4xl ${open ? "" : "opacity-30 grayscale"}`} aria-hidden>
                {stage.emoji}
              </span>
              <span className="mt-1 block text-sm font-extrabold text-emerald-deep">{stage.name}</span>
              <span className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-muted">
                {open ? <Check className="size-3.5 text-[#12a15b]" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
                {toArabicDigits(stage.stations)} محطة
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 text-center">
        <Link href={"/kids/rewards?tab=shop" as Route} className={kidsButton("sky")}>
          <ShoppingBag aria-hidden /> زيّن حديقتك من المتجر
        </Link>
      </div>
    </div>
  );
}
