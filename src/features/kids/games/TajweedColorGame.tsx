"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { TAJWEED_RULES, type TajweedAyah } from "@/features/quran/tajweedApi";
import type { Surah } from "@/features/quran/api";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { buildTajweedMatchRound, checkTajweedMatch, type TajweedMatchRound, type TajweedMatchTarget } from "./matchGameLogic";

// Beginner-friendly rules only; silent letters and advanced idgham types are left out.
const KIDS_RULES = [
  "ghunnah",
  "idgham_ghunnah",
  "idgham_wo_ghunnah",
  "idgham_shafawi",
  "ikhafa",
  "ikhafa_shafawi",
  "iqlab",
  "qalaqah",
  "madda_normal",
  "madda_permissible",
  "madda_obligatory",
  "madda_necessary",
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function kidsRound(ayah: TajweedAyah): TajweedMatchRound | null {
  const round = buildTajweedMatchRound(ayah);
  if (!round) return null;
  const targets = round.targets.filter((target) => KIDS_RULES.includes(target.ruleClass));
  if (targets.length < 2) return null;
  const allowed = new Set(targets.map((target) => target.id));
  return {
    ...round,
    targets,
    displaySegments: round.displaySegments.map((segment) =>
      segment.targetId && !allowed.has(segment.targetId) ? { ...segment, targetId: null } : segment,
    ),
  };
}

export function TajweedColorGame({ surah, ayahs }: { surah: Surah; ayahs: TajweedAyah[] }) {
  const { recordMatchGameCompletion } = useKidsProgress();
  const rounds = ayahs.map(kidsRound).filter((round): round is TajweedMatchRound => round !== null);
  const [round, setRound] = useState<TajweedMatchRound | null>(null);
  const [selected, setSelected] = useState<TajweedMatchTarget | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  function newRound() {
    const next = rounds[Math.floor(Math.random() * rounds.length)] ?? null;
    setRound(next);
    setSelected(null);
    setSolved(new Set());
    setWon(false);
    setMistakes(0);
    sfx.tap();
  }

  function pick(target: TajweedMatchTarget) {
    if (solved.has(target.id)) return;
    sfx.tap();
    setSelected(target);
    setWrong(null);
    const distractors = shuffle(KIDS_RULES.filter((rule) => TAJWEED_RULES[rule]?.label !== TAJWEED_RULES[target.ruleClass]?.label)).slice(
      0,
      3,
    );
    setChoices(shuffle([target.ruleClass, ...distractors]));
  }

  function choose(rule: string) {
    if (!selected || !round) return;
    if (!checkTajweedMatch(selected, rule)) {
      sfx.wrong();
      setWrong(rule);
      setMistakes((value) => value + 1);
      return;
    }
    sfx.correct();
    const next = new Set(solved).add(selected.id);
    setSolved(next);
    setSelected(null);
    if (next.size === round.targets.length) {
      setTimeout(() => {
        sfx.win();
        setWon(true);
        recordMatchGameCompletion("tajweed");
      }, 400);
    }
  }

  if (!round) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#e84a67] text-white shadow-[0_7px_0_#b92f49]">
          <Palette className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">لوّن التجويد — سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">في الآية كلمات مميّزة بخط منقّط. اضغط على كل واحدة، ثم اختر حكم التجويد الصحيح لتتلوّن!</p>
        {rounds.length > 0 ? (
          <button type="button" onClick={newRound} className={kidsButton("rose", "mt-6 px-10")}>
            ابدأ اللعب
          </button>
        ) : (
          <p className="mt-6 text-muted">لا تتوفر أحكام كافية في هذه السورة، جرّب سورة أخرى.</p>
        )}
        <Link href="/kids/games/tajweed" className="mt-4 block text-sm font-bold text-muted underline">
          اختر سورة أخرى
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">
          سورة {surah.name} — الآية {toArabicDigits(round.ayahNumberInSurah)}
        </h1>
        <p className="font-extrabold text-muted">
          لوّنت {toArabicDigits(solved.size)} من {toArabicDigits(round.targets.length)}
        </p>
      </div>

      <section className={cn(kidsPanel, "text-center")}>
        <p className="quran-text text-4xl leading-[2.2] text-[#1b2a24] sm:text-5xl sm:leading-[2.2]">
          {round.displaySegments.map((segment, index) => {
            if (!segment.targetId) return <span key={index}>{segment.text}</span>;
            const target = round.targets.find((entry) => entry.id === segment.targetId)!;
            const isSolved = solved.has(target.id);
            const isSelected = selected?.id === target.id;
            return (
              <button
                key={index}
                type="button"
                onClick={() => pick(target)}
                aria-label={isSolved ? TAJWEED_RULES[target.ruleClass]?.label : "كلمة فيها حكم تجويد"}
                className={cn(
                  "rounded-lg px-0.5 transition-colors duration-500",
                  isSolved ? "" : "border-b-4 border-dotted border-[#f5b92e] hover:bg-[#fff6d8]",
                  isSelected && "bg-[#fff6d8] ring-2 ring-[#f5b92e]",
                )}
                style={isSolved ? { color: TAJWEED_RULES[target.ruleClass]?.color } : undefined}
              >
                {segment.text}
              </button>
            );
          })}
        </p>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-7"
            >
              <p className="text-lg font-extrabold text-emerald-deep">ما حكم الجزء المختار؟</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {choices.map((rule) => (
                  <motion.button
                    key={rule}
                    type="button"
                    onClick={() => choose(rule)}
                    animate={wrong === rule ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                    className={cn(kidsButton("white", "w-full py-3 text-base"), wrong === rule && "opacity-50")}
                  >
                    <span className="size-4 rounded-full" style={{ background: TAJWEED_RULES[rule]?.color }} aria-hidden />
                    {TAJWEED_RULES[rule]?.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-7 text-lg font-bold text-muted">
              اضغط على كلمة منقّطة لتبدأ
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      <Celebration
        open={won}
        title="رائع! لوّنت كل الأحكام"
        message={mistakes === 0 ? "بدون أي خطأ!" : `مع ${toArabicDigits(mistakes)} محاولة خاطئة`}
        stars={mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1}
      >
        <button type="button" onClick={newRound} className={kidsButton("rose")}>
          آية أخرى
        </button>
        <Link href="/kids/games" className={kidsButton("white")}>
          ألعاب أخرى
        </Link>
      </Celebration>
    </div>
  );
}
