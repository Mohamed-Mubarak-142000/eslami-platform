"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Lightbulb, RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { buildWordTiles, isPlayableAyah, wrongPositions, type WordTile } from "./arrangeGameLogic";

export function ArrangeAyahGame({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const playable = ayahs.filter((ayah) => isPlayableAyah(ayah.text));
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [bank, setBank] = useState<WordTile[]>([]);
  const [placed, setPlaced] = useState<WordTile[]>([]);
  const [checked, setChecked] = useState(false);
  const [won, setWon] = useState(false);
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);

  function startAyah(next: Ayah) {
    setAyah(next);
    setBank(buildWordTiles(next.text));
    setPlaced([]);
    setChecked(false);
    setWon(false);
    setTries(0);
    setHint(false);
    sfx.tap();
  }

  function randomAyah() {
    const choices = playable.filter((entry) => entry.number !== ayah?.number);
    const next = choices[Math.floor(Math.random() * choices.length)] ?? playable[0];
    if (next) startAyah(next);
  }

  function place(tile: WordTile) {
    sfx.tap();
    setChecked(false);
    setBank((current) => current.filter((entry) => entry.id !== tile.id));
    const nextPlaced = [...placed, tile];
    setPlaced(nextPlaced);
    if (nextPlaced.length === (ayah ? bank.length + placed.length : 0)) check(nextPlaced);
  }

  function unplace(tile: WordTile) {
    sfx.flip();
    setChecked(false);
    setPlaced((current) => current.filter((entry) => entry.id !== tile.id));
    setBank((current) => [...current, tile]);
  }

  function check(order: WordTile[]) {
    setChecked(true);
    setTries((value) => value + 1);
    if (wrongPositions(order).size === 0) {
      sfx.win();
      setTimeout(() => setWon(true), 350);
    } else {
      sfx.wrong();
    }
  }

  if (!ayah) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#12a15b] text-white shadow-[0_7px_0_#0b7a44]">
          <Shuffle className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">رتّب الآية — سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">الكلمات مبعثرة! اضغط عليها بالترتيب الصحيح لتكوّن الآية كما في المصحف.</p>
        {playable.length > 0 ? (
          <button type="button" onClick={randomAyah} className={kidsButton("emerald", "mt-6 px-10")}>
            ابدأ اللعب
          </button>
        ) : (
          <p className="mt-6 text-muted">آيات هذه السورة غير مناسبة لهذه اللعبة، جرّب سورة أخرى.</p>
        )}
        <Link href="/kids/games/arrange" className="mt-4 block text-sm font-bold text-muted underline">
          اختر سورة أخرى
        </Link>
      </div>
    );
  }

  const wrong = checked ? wrongPositions(placed) : new Set<string>();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">
          سورة {surah.name} — الآية {toArabicDigits(ayah.numberInSurah)}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHint((value) => !value)}
            aria-pressed={hint}
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#8a5a00]"
          >
            <Lightbulb className="size-4" aria-hidden /> {hint ? "إخفاء المساعدة" : "مساعدة"}
          </button>
          <button
            type="button"
            onClick={() => startAyah(ayah)}
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-ink"
          >
            <RotateCcw className="size-4" aria-hidden /> من جديد
          </button>
        </div>
      </div>

      <LayoutGroup>
        <section className={cn(kidsPanel, "text-center")}>
          <AnimatePresence>
            {hint && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 0.55 }}
                exit={{ height: 0, opacity: 0 }}
                className="quran-text overflow-hidden text-2xl text-muted"
              >
                {ayah.text}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-sm font-extrabold text-muted">الآية بالترتيب:</p>
          <div
            className={cn(
              "mt-3 flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-[2rem] border-4 border-dashed p-4 transition-colors",
              checked && wrong.size === 0
                ? "border-[#12a15b] bg-[#eafbf1]"
                : checked
                  ? "border-[#e84a67]/60 bg-[#fff1f3]"
                  : "border-[#dfe6da] bg-ivory",
            )}
          >
            {placed.length === 0 && <span className="text-muted">اضغط على الكلمات بالأسفل…</span>}
            {placed.map((tile) => (
              <motion.button
                layoutId={tile.id}
                key={tile.id}
                type="button"
                onClick={() => unplace(tile)}
                animate={wrong.has(tile.id) ? { y: [0, -6, 0] } : { y: 0 }}
                className={cn(
                  "quran-text rounded-2xl px-4 py-1.5 text-3xl shadow-[0_4px_0_#d9dccf] ring-2",
                  wrong.has(tile.id) ? "bg-[#ffe3e8] ring-[#e84a67]" : checked ? "bg-[#dff7e8] ring-[#12a15b]" : "bg-white ring-[#e6eadf]",
                )}
              >
                {tile.text}
              </motion.button>
            ))}
          </div>

          <p className="mt-7 text-sm font-extrabold text-muted">الكلمات:</p>
          <div className="mt-3 flex min-h-20 flex-wrap items-center justify-center gap-3">
            {bank.map((tile) => (
              <motion.button
                layoutId={tile.id}
                key={tile.id}
                type="button"
                onClick={() => place(tile)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.92 }}
                className="quran-text rounded-2xl bg-[#fff6d8] px-5 py-2 text-3xl text-[#3b2f1b] shadow-[0_5px_0_#e6c875] ring-2 ring-[#f5d88a]"
              >
                {tile.text}
              </motion.button>
            ))}
          </div>
          {checked && wrong.size > 0 && (
            <p className="mt-5 font-extrabold text-[#b92f49]">قريب! الكلمات الحمراء في غير مكانها، اضغط عليها لإرجاعها.</p>
          )}
        </section>
      </LayoutGroup>

      <Celebration
        open={won}
        title="ممتاز! رتّبت الآية"
        message={tries === 1 ? "من أول محاولة!" : `في ${toArabicDigits(tries)} محاولات`}
        stars={tries === 1 ? 3 : tries === 2 ? 2 : 1}
      >
        <button type="button" onClick={randomAyah} className={kidsButton("emerald")}>
          آية أخرى
        </button>
        <Link href="/kids/games" className={kidsButton("white")}>
          ألعاب أخرى
        </Link>
      </Celebration>
    </div>
  );
}
