"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ListOrdered, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { useCompanion } from "../companion/CompanionProvider";
import { buildAyahOrderRound, expectedNext, type AyahOrderRound } from "./ayahOrderLogic";
import { starsForSlips } from "./gameUtils";

/**
 * The child taps the ayahs in Mushaf order. A wrong tap only wiggles the card and stays in the
 * pile, so the puzzle always ends in success.
 */
export function AyahOrderGame({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const { recordGame } = useKidsProgress();
  const { react } = useCompanion();
  const [round, setRound] = useState<AyahOrderRound | null>(null);
  const [placed, setPlaced] = useState<Ayah[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [slips, setSlips] = useState(0);
  const [won, setWon] = useState(false);

  function start() {
    const next = buildAyahOrderRound(ayahs);
    if (!next) return;
    sfx.tap();
    setRound(next);
    setPlaced([]);
    setSlips(0);
    setWon(false);
  }

  function tap(ayah: Ayah) {
    if (!round) return;
    const expected = expectedNext(round, placed.length);
    if (expected?.number !== ayah.number) {
      sfx.flip();
      react("almost");
      setSlips((value) => value + 1);
      setShake(ayah.number);
      setTimeout(() => setShake(null), 450);
      return;
    }
    sfx.correct();
    const next = [...placed, ayah];
    setPlaced(next);
    if (next.length === round.ordered.length) {
      recordGame({
        game: "ayah_order",
        surah: surah.id,
        score: next.length,
        total: next.length + slips,
        stars: starsForSlips(slips, next.length),
      });
      sfx.win();
      setTimeout(() => setWon(true), 400);
    } else react("correct");
  }

  if (!round) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#f5b92e] text-white shadow-[0_7px_0_#c98f10]">
          <ListOrdered className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">رتّب الآيات: سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">الآيات اختلط ترتيبها! اضغط على الآيات واحدة واحدة بترتيبها في المصحف.</p>
        {ayahs.length >= 2 ? (
          <button type="button" onClick={start} className={kidsButton("gold", "mt-6 px-10")}>
            ابدأ اللعب
          </button>
        ) : (
          <p className="mt-6 text-muted">هذه السورة قصيرة جدًا لهذه اللعبة.</p>
        )}
      </div>
    );
  }

  const pile = round.shuffled.filter((ayah) => !placed.some((entry) => entry.number === ayah.number));
  const firstNumber = round.ordered[0]!.numberInSurah;
  const lastNumber = round.ordered.at(-1)!.numberInSurah;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">
          سورة {surah.name}
          {round.ordered.length < ayahs.length && (
            <span className="text-base text-muted">
              {" "}
              · الآيات {toArabicDigits(firstNumber)}–{toArabicDigits(lastNumber)}
            </span>
          )}
        </h1>
        <button type="button" onClick={start} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-ink">
          <RotateCcw className="size-4" aria-hidden /> من جديد
        </button>
      </div>

      <LayoutGroup>
        <section className={kidsPanel}>
          <p className="text-center text-sm font-extrabold text-muted">بالترتيب:</p>
          <ol className="mt-3 min-h-20 space-y-2 rounded-[2rem] border-4 border-dashed border-[#dfe6da] bg-ivory p-3">
            {placed.length === 0 && <li className="p-3 text-center text-muted">أيّ آية تأتي أولًا؟</li>}
            {placed.map((ayah) => (
              <motion.li
                layoutId={`ayah-${ayah.number}`}
                key={ayah.number}
                className="quran-text flex items-start gap-3 rounded-2xl bg-[#dff7e8] px-4 py-3 text-2xl leading-loose ring-2 ring-[#12a15b]"
              >
                <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#12a15b] font-kids text-base font-extrabold text-white">
                  {toArabicDigits(ayah.numberInSurah)}
                </span>
                <span>{ayah.text}</span>
              </motion.li>
            ))}
          </ol>

          <p className="mt-6 text-center text-sm font-extrabold text-muted">الآيات المختلطة:</p>
          <ul className="mt-3 space-y-3">
            <AnimatePresence>
              {pile.map((ayah) => (
                <motion.li key={ayah.number} layoutId={`ayah-${ayah.number}`} exit={{ opacity: 0 }}>
                  <motion.button
                    type="button"
                    onClick={() => tap(ayah)}
                    animate={shake === ayah.number ? { x: [0, -10, 10, -6, 0] } : { x: 0 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "quran-text w-full rounded-2xl bg-[#fff6d8] px-5 py-3 text-2xl leading-loose text-[#3b2f1b] shadow-[0_5px_0_#e6c875] ring-2 ring-[#f5d88a]",
                      shake === ayah.number && "bg-[#ffeef0] ring-[#f3b6c2]",
                    )}
                  >
                    {ayah.text}
                  </motion.button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </LayoutGroup>

      <Celebration
        open={won}
        title="ممتاز! رتّبت الآيات"
        message={`سورة ${surah.name} بترتيبها الصحيح`}
        stars={starsForSlips(slips, round.ordered.length)}
      >
        <button type="button" onClick={start} className={kidsButton("gold")}>
          العب مرة أخرى
        </button>
        <Link href={`/kids/journey/${surah.id}`} className={kidsButton("white")}>
          العودة للمحطة
        </Link>
      </Celebration>
    </div>
  );
}
