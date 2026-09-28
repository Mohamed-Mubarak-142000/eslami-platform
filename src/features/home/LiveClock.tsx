"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toArabicDigits } from "@/lib/arabic";
import { cn } from "@/lib/cn";

function RollingDigit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1.15em] w-[0.62em] overflow-hidden text-center align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {toArabicDigits(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Pair({ value }: { value: number }) {
  const text = String(value).padStart(2, "0");
  return (
    <span className="inline-flex" dir="ltr">
      <RollingDigit value={text[0]!} />
      <RollingDigit value={text[1]!} />
    </span>
  );
}

export function LiveClock({ now, className }: { now: Date | null; className?: string }) {
  if (!now) return <div className={cn("h-16", className)} aria-hidden />;
  const hours = now.getHours();
  const period = hours < 12 ? "صباحًا" : "مساءً";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const label = `${toArabicDigits(hour12)}:${toArabicDigits(String(now.getMinutes()).padStart(2, "0"))} ${period}`;

  return (
    <div className={className}>
      <p className="sr-only" aria-live="off">
        الساعة الآن {label}
      </p>
      <div className="flex items-baseline gap-2 font-display text-5xl font-bold tabular-nums" aria-hidden dir="ltr">
        <Pair value={hour12} />
        <span className="-mt-2 animate-pulse text-gold">:</span>
        <Pair value={now.getMinutes()} />
        <span className="text-2xl text-white/60">
          <Pair value={now.getSeconds()} />
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-gold-soft" aria-hidden>
        {period}
      </p>
    </div>
  );
}
