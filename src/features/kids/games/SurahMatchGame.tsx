"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookHeart, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { useCompanion } from "../companion/CompanionProvider";
import { buildSurahMatchCards, isSurahPair, SURAH_MATCH_PAIRS, type SurahMatchCard } from "./surahMatchLogic";

function starsFor(moves: number, pairs: number): number {
  if (moves <= pairs + 1) return 3;
  return moves <= pairs * 2 ? 2 : 1;
}

/** Memory game: find each surah's name and the ayah it begins with. */
export function SurahMatchGame({
  surahs,
  firstAyahs,
  focusSurahId,
}: {
  surahs: Surah[];
  firstAyahs: Record<number, string>;
  focusSurahId: number | null;
}) {
  const { recordGame } = useKidsProgress();
  const { react } = useCompanion();
  const [cards, setCards] = useState<SurahMatchCard[] | null>(null);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);
  const pairs = cards ? cards.length / 2 : SURAH_MATCH_PAIRS;

  function start() {
    setCards(buildSurahMatchCards(surahs, firstAyahs, focusSurahId));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setWon(false);
    lockRef.current = false;
    sfx.tap();
  }

  function flip(card: SurahMatchCard) {
    if (!cards || lockRef.current || matched.has(card.id) || flipped.includes(card.id)) return;
    sfx.flip();
    if (flipped.length === 0) {
      setFlipped([card.id]);
      return;
    }
    const first = cards.find((entry) => entry.id === flipped[0]);
    setFlipped([flipped[0]!, card.id]);
    setMoves((value) => value + 1);
    if (first && isSurahPair(first, card)) {
      const nextMatched = new Set(matched).add(first.id).add(card.id);
      setMatched(nextMatched);
      setFlipped([]);
      sfx.correct();
      react("correct");
      if (nextMatched.size === cards.length) {
        setTimeout(() => {
          sfx.win();
          setWon(true);
          recordGame({
            game: "surah_match",
            surah: focusSurahId,
            score: pairs,
            total: pairs,
            moves: moves + 1,
            stars: starsFor(moves + 1, pairs),
          });
        }, 450);
      }
      return;
    }
    lockRef.current = true;
    setTimeout(() => {
      setFlipped([]);
      lockRef.current = false;
    }, 1100);
  }

  if (!cards) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#12a15b] text-white shadow-[0_7px_0_#0b7a44]">
          <BookHeart className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep sm:text-4xl">ذاكرة السور</h1>
        <p className="mt-2 text-lg text-muted">اقلب بطاقتين: طابق اسم كل سورة مع أول آية فيها!</p>
        <button type="button" onClick={start} className={kidsButton("emerald", "mt-6 px-10")}>
          ابدأ اللعب
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">ذاكرة السور</h1>
        <p className="font-extrabold text-muted">
          الأزواج:{" "}
          <span className="text-emerald-deep">
            {toArabicDigits(matched.size / 2)}/{toArabicDigits(pairs)}
          </span>
        </p>
        <button type="button" onClick={start} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-ink">
          <RotateCcw className="size-4" aria-hidden /> من جديد
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((card, index) => {
          const open = flipped.includes(card.id) || matched.has(card.id);
          const isMatched = matched.has(card.id);
          return (
            <motion.li
              key={card.id}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 16 }}
              className="[perspective:900px]"
            >
              <button
                type="button"
                onClick={() => flip(card)}
                aria-label={open ? card.text : "بطاقة مقلوبة"}
                className="relative block aspect-[4/5] w-full"
              >
                <motion.span
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  animate={{ rotateY: open ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <span
                    className={cn(
                      "absolute inset-0 grid place-items-center rounded-[1.5rem] [backface-visibility:hidden]",
                      card.type === "name"
                        ? "bg-linear-to-br from-[#2fc27a] to-[#0b7a44] shadow-[0_6px_0_#08603a]"
                        : "bg-linear-to-br from-[#ffd166] to-[#e0a800] shadow-[0_6px_0_#b88900]",
                    )}
                  >
                    <Star className="size-10 fill-white/30 text-white/70" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "absolute inset-0 grid place-items-center rounded-[1.5rem] bg-white p-3 text-center shadow-[0_6px_0_#d9dccf] ring-4 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                      isMatched ? "ring-[#12a15b]" : "ring-[#e6eadf]",
                    )}
                  >
                    <span
                      className={cn(
                        "text-emerald-deep",
                        card.type === "ayah" ? "quran-text text-xl leading-loose sm:text-2xl" : "text-xl font-extrabold sm:text-2xl",
                      )}
                    >
                      {card.text}
                    </span>
                  </span>
                </motion.span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Celebration open={won} title="أحسنت! وجدت كل الأزواج" message={`في ${toArabicDigits(moves)} محاولة`} stars={starsFor(moves, pairs)}>
        <button type="button" onClick={start} className={kidsButton("emerald")}>
          العب مرة أخرى
        </button>
        <Link href="/kids/games" className={kidsButton("white")}>
          ألعاب أخرى
        </Link>
      </Celebration>
    </div>
  );
}
