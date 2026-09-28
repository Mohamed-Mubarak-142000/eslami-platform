"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { ARABIC_LETTERS } from "./arabicLetters";
import { buildLetterMatchRound, isMatchingPair, type LetterMatchTile } from "./letterGameLogic";

const LEVELS = [
  { pairs: 4, label: "سهل", tone: "emerald" as const },
  { pairs: 6, label: "متوسط", tone: "gold" as const },
  { pairs: 8, label: "صعب", tone: "rose" as const },
];

function starsFor(moves: number, pairs: number): number {
  if (moves <= pairs + 2) return 3;
  if (moves <= Math.ceil(pairs * 1.7)) return 2;
  return 1;
}

export function LetterMemoryGame() {
  const { recordMatchGameCompletion } = useKidsProgress();
  const [tiles, setTiles] = useState<LetterMatchTile[] | null>(null);
  const [pairs, setPairs] = useState(0);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);

  function start(pairCount: number) {
    const round = buildLetterMatchRound(ARABIC_LETTERS, pairCount);
    setTiles(round.tiles);
    setPairs(round.pairCount);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setWon(false);
    lockRef.current = false;
    sfx.tap();
  }

  function flip(tile: LetterMatchTile) {
    if (!tiles || lockRef.current || matched.has(tile.id) || flipped.includes(tile.id)) return;
    sfx.flip();
    if (flipped.length === 0) {
      setFlipped([tile.id]);
      return;
    }
    const first = tiles.find((entry) => entry.id === flipped[0]);
    setFlipped([flipped[0]!, tile.id]);
    setMoves((value) => value + 1);
    if (first && isMatchingPair(first, tile)) {
      const nextMatched = new Set(matched).add(first.id).add(tile.id);
      setMatched(nextMatched);
      setFlipped([]);
      sfx.correct();
      if (nextMatched.size === tiles.length) {
        setTimeout(() => {
          sfx.win();
          setWon(true);
          recordMatchGameCompletion("letters");
        }, 450);
      }
      return;
    }
    lockRef.current = true;
    setTimeout(() => {
      sfx.wrong();
      setFlipped([]);
      lockRef.current = false;
    }, 900);
  }

  if (!tiles) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#7a5af5] text-white shadow-[0_7px_0_#5a3ed1]">
          <Brain className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep sm:text-4xl">ذاكرة الحروف</h1>
        <p className="mt-2 text-lg text-muted">اقلب بطاقتين: إذا كان الحرف واسمه متطابقين يبقيان مفتوحين. هل تجد كل الأزواج؟</p>
        <p className="mt-6 text-base font-extrabold text-emerald-deep">اختر المستوى:</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {LEVELS.map((level) => (
            <button key={level.pairs} type="button" onClick={() => start(level.pairs)} className={kidsButton(level.tone, "min-w-32")}>
              {level.label}
              <span className="text-sm opacity-80">({toArabicDigits(level.pairs)} أزواج)</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const columns = tiles.length <= 8 ? "grid-cols-4" : tiles.length <= 12 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">ذاكرة الحروف</h1>
        <p className="font-extrabold text-muted">
          المحاولات: <span className="text-emerald-deep">{toArabicDigits(moves)}</span> · الأزواج:{" "}
          <span className="text-emerald-deep">
            {toArabicDigits(matched.size / 2)}/{toArabicDigits(pairs)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setTiles(null)}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-ink"
        >
          <RotateCcw className="size-4" aria-hidden /> من جديد
        </button>
      </div>

      <ul className={cn("grid gap-3 sm:gap-4", columns)}>
        {tiles.map((tile, index) => {
          const open = flipped.includes(tile.id) || matched.has(tile.id);
          const isMatched = matched.has(tile.id);
          return (
            <motion.li
              key={tile.id}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 16 }}
              className="[perspective:900px]"
            >
              <button
                type="button"
                onClick={() => flip(tile)}
                aria-label={open ? tile.value : "بطاقة مقلوبة"}
                className="relative block aspect-[3/4] w-full"
              >
                <motion.span
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  animate={{ rotateY: open ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <span className="absolute inset-0 grid place-items-center rounded-[1.5rem] bg-linear-to-br from-[#8b6cff] to-[#5a3ed1] shadow-[0_6px_0_#4630a8] [backface-visibility:hidden]">
                    <Star className="size-10 fill-white/30 text-white/60" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "absolute inset-0 grid place-items-center rounded-[1.5rem] bg-white p-2 text-center shadow-[0_6px_0_#d9dccf] ring-4 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                      isMatched ? "ring-[#12a15b]" : "ring-[#e6eadf]",
                    )}
                  >
                    <span
                      className={cn(
                        "font-extrabold text-emerald-deep",
                        tile.type === "letter" ? "quran-text text-5xl sm:text-6xl" : "text-xl sm:text-2xl",
                      )}
                    >
                      {tile.value}
                    </span>
                  </span>
                </motion.span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Celebration open={won} title="أحسنت! وجدت كل الأزواج" message={`في ${toArabicDigits(moves)} محاولة`} stars={starsFor(moves, pairs)}>
        <button type="button" onClick={() => start(pairs)} className={kidsButton("emerald")}>
          العب مرة أخرى
        </button>
        <Link href="/kids/games" className={kidsButton("white")}>
          ألعاب أخرى
        </Link>
      </Celebration>
    </div>
  );
}
