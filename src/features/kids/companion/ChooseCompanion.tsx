"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket } from "lucide-react";
import type { CompanionAnimal } from "@/lib/supabase/database.types";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { Companion } from "./Companion";
import { COMPANIONS, companionInfo } from "./companionLines";
import { SpeechBubble } from "./CompanionCorner";

export function ChooseCompanion() {
  const router = useRouter();
  const learner = useActiveLearner();
  const { state, chooseCompanion } = useKidsProgress();
  const [picked, setPicked] = useState<CompanionAnimal | null>(state.companion?.animal ?? null);
  const changing = state.companion !== null;

  function start() {
    if (!picked) return;
    sfx.win();
    chooseCompanion(picked);
    router.push(changing ? "/kids/rewards" : "/kids");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className={`${kidsPanel} text-center`}>
        <p className="text-5xl" aria-hidden>
          👋
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-deep sm:text-4xl">
          {learner ? `أهلًا يا ${learner.display_name}!` : "أهلًا يا بطل!"}
        </h1>
        <p className="mt-2 text-xl text-muted">مَن سيرافقك في رحلتك مع القرآن؟</p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {COMPANIONS.map((companion, index) => {
          const selected = picked === companion.animal;
          return (
            <motion.li
              key={companion.animal}
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 240, damping: 16 }}
            >
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setPicked(companion.animal);
                }}
                aria-pressed={selected}
                className={`flex w-full flex-col items-center rounded-[2rem] bg-white/95 p-4 shadow-lift ring-4 transition-transform hover:-translate-y-1 ${
                  selected ? "ring-[#f5b92e] -translate-y-1" : "ring-white/60"
                }`}
              >
                <Companion animal={companion.animal} mood={selected ? "cheer" : "idle"} className="h-40 w-full sm:h-48" />
                <span
                  className="mt-2 rounded-full px-5 py-1.5 text-xl font-extrabold text-white"
                  style={{ background: companion.color, boxShadow: `0 5px 0 ${companion.shadow}` }}
                >
                  {companion.name}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-6 flex min-h-32 flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {picked && <SpeechBubble line={companionInfo(picked).intro} className="text-center text-lg" />}
        </AnimatePresence>
        <button type="button" onClick={start} disabled={!picked} className={kidsButton("gold", "px-10 py-4 text-2xl [&_svg]:size-7")}>
          <Rocket aria-hidden /> {changing ? "هذا رفيقي!" : "هيا نبدأ الرحلة!"}
        </button>
      </div>
    </div>
  );
}
