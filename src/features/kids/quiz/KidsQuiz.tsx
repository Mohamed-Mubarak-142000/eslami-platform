"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { generateQuiz } from "./quizGenerator";
import type { QuizQuestion } from "./quizTypes";

const QUESTION_COUNT = 8;

export function KidsQuiz({ surahs, ayahsBySurah }: { surahs: Surah[]; ayahsBySurah: Record<number, Ayah[]> }) {
  const { recordQuizResult } = useKidsProgress();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function start() {
    setQuestions(generateQuiz(surahs, ayahsBySurah, QUESTION_COUNT));
    setCurrent(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
    sfx.tap();
  }

  const question = questions?.[current];

  function choose(choiceId: string) {
    if (!question || answer) return;
    setAnswer(choiceId);
    if (choiceId === question.correctChoiceId) {
      sfx.correct();
      setScore((value) => value + 1);
    } else {
      sfx.wrong();
    }
  }

  function next() {
    if (!questions) return;
    if (current === questions.length - 1) {
      const finalScore = score;
      recordQuizResult(finalScore, questions.length);
      sfx.win();
      setFinished(true);
      return;
    }
    setCurrent((value) => value + 1);
    setAnswer(null);
  }

  if (!questions) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#f5b92e] text-white shadow-[0_7px_0_#c98f10]">
          <Sparkles className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep sm:text-4xl">اختبر نفسك</h1>
        <p className="mt-2 text-lg text-muted">{toArabicDigits(QUESTION_COUNT)} أسئلة: أكمل الآية التالية، أو اعرف من أي سورة هذه الآية.</p>
        <button type="button" onClick={start} disabled={surahs.length === 0} className={kidsButton("gold", "mt-6 px-10")}>
          ابدأ الاختبار
        </button>
      </div>
    );
  }

  if (questions.length === 0) return <p className={`${kidsPanel} text-center text-muted`}>تعذّر تحضير الأسئلة الآن، جرّب بعد قليل.</p>;
  const percent = Math.round((score / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <div className="flex items-center justify-between font-extrabold text-emerald-deep">
          <span>
            السؤال {toArabicDigits(Math.min(current + 1, questions.length))} من {toArabicDigits(questions.length)}
          </span>
          <span className="inline-flex items-center gap-1 text-[#8a5a00]">
            <Star className="size-5 fill-[#f5c542] text-[#e0a800]" aria-hidden /> {toArabicDigits(score)}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#eef1ec]">
          <motion.div
            className="h-full rounded-full bg-linear-to-l from-[#f5b92e] to-[#12a15b]"
            animate={{ width: `${((current + (answer ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.section
            key={question.id}
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={cn(kidsPanel, "text-center")}
          >
            <p className="inline-block rounded-full bg-[#fff6d8] px-4 py-1 font-extrabold text-[#8a5a00]">{question.promptLabel}</p>
            <p className="quran-text mt-5 text-3xl leading-[2] text-[#1b2a24] sm:text-4xl">{question.prompt}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {question.choices.map((choice) => {
                const isCorrect = choice.id === question.correctChoiceId;
                const picked = answer === choice.id;
                const reveal = answer !== null;
                return (
                  <motion.button
                    key={choice.id}
                    type="button"
                    onClick={() => choose(choice.id)}
                    disabled={reveal}
                    animate={
                      reveal && picked && !isCorrect ? { x: [0, -10, 10, -6, 6, 0] } : reveal && isCorrect ? { scale: [1, 1.06, 1] } : {}
                    }
                    transition={{ duration: 0.45 }}
                    className={cn(
                      "relative flex min-h-16 items-center justify-center gap-2 rounded-3xl px-4 py-3 text-center ring-4 transition-colors",
                      question.kind === "complete-ayah" ? "quran-text text-2xl leading-[1.9]" : "font-kids text-2xl font-extrabold",
                      reveal && isCorrect
                        ? "bg-[#dff7e8] text-[#0b7a44] ring-[#12a15b]"
                        : reveal && picked
                          ? "bg-[#ffe3e8] text-[#b92f49] ring-[#e84a67]"
                          : "bg-white text-emerald-deep ring-[#e6eadf] hover:ring-[#f5b92e]",
                      reveal && !isCorrect && !picked && "opacity-50",
                    )}
                  >
                    {reveal && isCorrect && <Check className="size-6 shrink-0" aria-hidden />}
                    {reveal && picked && !isCorrect && <X className="size-6 shrink-0" aria-hidden />}
                    <span>{choice.label}</span>
                  </motion.button>
                );
              })}
            </div>
            {answer && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <p className="mb-3 text-xl font-extrabold">
                  {answer === question.correctChoiceId ? "إجابة صحيحة!" : "لا بأس، تعلّمنا الإجابة الصحيحة"}
                </p>
                <button type="button" onClick={next} className={kidsButton("emerald", "px-10")}>
                  {current === questions.length - 1 ? "النتيجة" : "السؤال التالي"}
                </button>
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <Celebration
        open={finished}
        title={percent >= 80 ? "بطل! نتيجة رائعة" : percent >= 50 ? "أحسنت!" : "محاولة جميلة!"}
        message={`أجبت ${toArabicDigits(score)} من ${toArabicDigits(questions.length)} إجابة صحيحة`}
        stars={percent >= 90 ? 3 : percent >= 50 ? 2 : 1}
      >
        <button type="button" onClick={start} className={kidsButton("gold")}>
          اختبار جديد
        </button>
        <Link href="/kids" className={kidsButton("white")}>
          الحديقة
        </Link>
      </Celebration>
    </div>
  );
}
