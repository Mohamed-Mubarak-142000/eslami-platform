"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleHelp, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { useCompanion } from "../companion/CompanionProvider";
import { buildTrueFalseQuiz, type TrueFalseQuestion } from "./trueFalseLogic";

export function TrueFalseGame({ surahs, firstAyahs }: { surahs: Surah[]; firstAyahs: Record<number, string> }) {
  const { recordGame } = useKidsProgress();
  const { react } = useCompanion();
  const [questions, setQuestions] = useState<TrueFalseQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [won, setWon] = useState(false);

  function start() {
    sfx.tap();
    setQuestions(buildTrueFalseQuiz(surahs, firstAyahs));
    setIndex(0);
    setAnswer(null);
    setCorrect(0);
    setWon(false);
  }

  const question = questions[index];

  function choose(value: boolean) {
    if (!question || answer !== null) return;
    setAnswer(value);
    if (value === question.answer) {
      sfx.correct();
      react("correct");
      setCorrect((count) => count + 1);
    } else {
      sfx.flip();
      react("almost");
    }
  }

  function next() {
    sfx.tap();
    if (index + 1 >= questions.length) {
      recordGame({ game: "true_false", score: correct, total: questions.length });
      sfx.win();
      setWon(true);
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
  }

  if (!question) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#e84a67] text-white shadow-[0_7px_0_#b92f49]">
          <CircleHelp className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">صح أم خطأ؟</h1>
        <p className="mt-2 text-lg text-muted">جمل عن سور القرآن: هل هي صحيحة أم خطأ؟ وبعد كل جملة تتعلّم معلومة جديدة!</p>
        <button type="button" onClick={start} className={kidsButton("rose", "mt-6 px-10")}>
          ابدأ اللعب
        </button>
      </div>
    );
  }

  const right = answer !== null && answer === question.answer;
  const stars = correct >= questions.length ? 3 : correct >= questions.length * 0.6 ? 2 : 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">صح أم خطأ؟</h1>
        <span className="font-extrabold text-muted">
          {toArabicDigits(index + 1)} / {toArabicDigits(questions.length)}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={question.id}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          className={cn(kidsPanel, "text-center")}
        >
          <p className="text-2xl font-extrabold leading-relaxed text-emerald-deep sm:text-3xl">{question.statement}</p>
          {question.ayah && <p className="quran-text mt-4 rounded-3xl bg-[#fffaf0] p-4 text-2xl leading-loose">{question.ayah}</p>}

          <div className="mt-6 grid grid-cols-2 gap-4">
            {[true, false].map((value) => {
              const picked = answer === value;
              return (
                <motion.button
                  key={String(value)}
                  type="button"
                  onClick={() => choose(value)}
                  disabled={answer !== null}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[2rem] py-5 text-2xl font-extrabold text-white transition-opacity",
                    value ? "bg-[#12a15b] shadow-[0_7px_0_#0b7a44]" : "bg-[#e84a67] shadow-[0_7px_0_#b92f49]",
                    answer !== null && !picked && "opacity-40",
                  )}
                >
                  {value ? <Check className="size-10" aria-hidden /> : <X className="size-10" aria-hidden />}
                  {value ? "صح" : "خطأ"}
                </motion.button>
              );
            })}
          </div>

          {answer !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <p className={cn("text-xl font-extrabold", right ? "text-[#0b7a44]" : "text-[#8a5a00]")}>
                {right ? "أحسنت! 🌟" : "قريب! ❤️ تعلّمنا معلومة جديدة:"}
              </p>
              <p className="mt-1 text-lg text-muted">{question.explanation}</p>
              <button type="button" onClick={next} className={kidsButton("emerald", "mt-4 px-10")}>
                {index + 1 >= questions.length ? "النتيجة" : "التالي"}
              </button>
            </motion.div>
          )}
        </motion.section>
      </AnimatePresence>

      <Celebration
        open={won}
        title="أحسنت يا بطل!"
        message={`عرفت ${toArabicDigits(correct)} من ${toArabicDigits(questions.length)}`}
        stars={stars}
      >
        <button type="button" onClick={start} className={kidsButton("rose")}>
          العب مرة أخرى
        </button>
        <Link href="/kids/games" className={kidsButton("white")}>
          ألعاب أخرى
        </Link>
      </Celebration>
    </div>
  );
}
