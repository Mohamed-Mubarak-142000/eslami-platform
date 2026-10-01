"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNow } from "@/features/time/useNow";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { Companion } from "./Companion";
import { useCompanion } from "./CompanionProvider";

export function SpeechBubble({ line, className = "" }: { line: string; className?: string }) {
  return (
    <motion.p
      key={line}
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className={`relative rounded-3xl bg-white px-4 py-2.5 text-base font-extrabold leading-snug text-emerald-deep shadow-lift ring-4 ring-white/60 ${className}`}
      role="status"
    >
      {line}
    </motion.p>
  );
}

/** The companion floating in a corner of every kids page, reacting to what happens. */
export function CompanionCorner() {
  const { state } = useKidsProgress();
  const { line, mood, react } = useCompanion();
  const now = useNow();
  const hour = now?.getHours();

  const greeted = useRef(false);

  // Greet once when the kids area opens.
  useEffect(() => {
    if (hour === undefined || greeted.current) return;
    const timer = setTimeout(() => {
      greeted.current = true;
      react(hour >= 4 && hour < 12 ? "greetMorning" : hour >= 17 || hour < 4 ? "greetEvening" : "greet");
    }, 600);
    return () => clearTimeout(timer);
  }, [hour, react]);

  if (!state.companion) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-2 z-30 flex items-end gap-1 sm:bottom-28 sm:left-4">
      <button
        type="button"
        onClick={() => react("greet")}
        className="pointer-events-auto size-20 shrink-0 drop-shadow-[0_8px_10px_rgb(0_40_30/30%)] sm:size-28"
        aria-label="رفيقك في الرحلة"
      >
        <Companion animal={state.companion.animal} equipped={state.companion.equipped} mood={mood} className="size-full" />
      </button>
      <div className="mb-10 max-w-48 sm:mb-16 sm:max-w-60">
        <AnimatePresence>{line && <SpeechBubble line={line} />}</AnimatePresence>
      </div>
    </div>
  );
}
