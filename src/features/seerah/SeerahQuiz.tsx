"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import type { SeerahEvent } from "./seerahContent";
import { updateSeerah, useSeerah } from "./seerahStore";

/** A few questions after a chapter, one at a time; answering them all earns the chapter's badge. */
export function SeerahQuiz({ event }: { event: SeerahEvent & { quiz: NonNullable<SeerahEvent["quiz"]> } }) {
  const { badges } = useSeerah();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const finished = index >= event.quiz.length;
  const question = event.quiz[index];

  function pick(option: number) {
    if (picked !== null || !question) return;
    setPicked(option);
    if (option === question.answer) setScore((value) => value + 1);
  }

  function next() {
    const last = index === event.quiz.length - 1;
    setIndex((value) => value + 1);
    setPicked(null);
    if (last)
      updateSeerah((current) => (current.badges.includes(event.id) ? current : { ...current, badges: [...current.badges, event.id] }));
  }

  return (
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm" aria-labelledby={`quiz-${event.id}`}>
      <h2 id={`quiz-${event.id}`} className="flex items-center gap-2 font-bold text-emerald-deep">
        <Award className="size-5 text-gold-deep" aria-hidden />
        اختبر ما قرأت
        {badges.includes(event.id) && (
          <span className="ms-auto rounded-full bg-gold-mist px-2.5 py-0.5 text-xs text-gold-deep">نلت شارة الفصل</span>
        )}
      </h2>

      <AnimatePresence mode="wait">
        {finished ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 text-center">
            <motion.div
              className="mx-auto grid size-20 place-items-center rounded-full bg-gold text-emerald-night shadow-gold"
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              <Award className="size-10" aria-hidden />
            </motion.div>
            <p className="mt-3 font-bold text-ink">
              أجبت {toArabicDigits(score)} من {toArabicDigits(event.quiz.length)} — شارة «{event.title}» لك
            </p>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setScore(0);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted underline underline-offset-4"
            >
              <RotateCcw className="size-4" aria-hidden />
              أعد الأسئلة
            </button>
          </motion.div>
        ) : (
          question && (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="mt-4"
            >
              <p className="text-xs text-muted">
                السؤال {toArabicDigits(index + 1)} من {toArabicDigits(event.quiz.length)}
              </p>
              <p className="mt-1 text-lg font-bold leading-8 text-ink">{question.question}</p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const right = picked !== null && optionIndex === question.answer;
                  const wrong = picked === optionIndex && optionIndex !== question.answer;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={picked !== null}
                      onClick={() => pick(optionIndex)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors",
                        right
                          ? "border-emerald bg-emerald-mist text-emerald-deep"
                          : wrong
                            ? "border-rose bg-rose/10 text-ink"
                            : "border-line hover:border-gold",
                      )}
                    >
                      {option}
                      {right && <Check className="size-5 text-emerald" aria-hidden />}
                      {wrong && <X className="size-5 text-rose" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <div className="mt-3 rounded-2xl bg-ivory p-3">
                  <p className="text-sm leading-7 text-ink">{question.why}</p>
                  <button type="button" onClick={next} className="mt-2 rounded-xl bg-emerald px-4 py-2 text-sm font-bold text-white">
                    {index === event.quiz.length - 1 ? "النتيجة" : "التالي"}
                  </button>
                </div>
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </section>
  );
}
