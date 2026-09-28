"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, ChevronLeft, ChevronRight, Clock, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { useNow } from "@/features/time/useNow";
import type { ExamQuestion, QuestionType } from "./examGenerator";
import { submitExamAction, type SubmitExamResult } from "./actions";

const QUESTION_TITLES: Record<QuestionType, string> = {
  next: "ما الآية التي تلي قوله تعالى:",
  complete: "أكمل الآية:",
  missing: "ما الكلمة الناقصة في الآية؟",
  surah: "في أي سورة وردت هذه الآية؟",
};

interface ExamRunnerProps {
  attemptId: string;
  juz: number;
  questions: ExamQuestion[];
  expiresAt: string;
  surahNames: Record<number, string>;
}

function ExamResult({ result, juz }: { result: SubmitExamResult; juz: number }) {
  const passed = result.status === "passed";
  const percent = result.total ? Math.round(((result.score ?? 0) / result.total) * 100) : 0;
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-4xl p-6 text-center shadow-lift sm:p-10",
        passed ? "bg-emerald-deep text-white" : "border border-line bg-white",
      )}
    >
      <span
        className={cn(
          "mx-auto grid size-20 place-items-center rounded-full",
          passed ? "bg-gold text-emerald-night" : "bg-rose/10 text-rose",
        )}
      >
        {passed ? <Award className="size-10" aria-hidden /> : <X className="size-10" aria-hidden />}
      </span>
      <h2 className={cn("mt-5 text-3xl font-bold", !passed && "text-emerald-deep")}>
        {passed ? "مبارك! اجتزت اختبار الجزء" : result.status === "expired" ? "انتهى وقت الاختبار" : "لم تبلغ درجة النجاح هذه المرة"}
      </h2>
      <p className={cn("mt-3 text-lg", passed ? "text-white/80" : "text-muted")}>
        درجتك {toArabicDigits(result.score ?? 0)} من {toArabicDigits(result.total ?? 0)} ({toArabicDigits(percent)}٪) — درجة النجاح{" "}
        {toArabicDigits(result.passPercent ?? 0)}٪
      </p>
      {result.perQuestion && (
        <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2" aria-label="نتيجة كل سؤال">
          {result.perQuestion.map((right, index) => (
            <li
              key={index}
              className={cn(
                "grid size-9 place-items-center rounded-xl text-sm font-bold",
                right ? "bg-emerald text-white" : "bg-rose/15 text-rose",
              )}
              aria-label={`السؤال ${index + 1}: ${right ? "صحيح" : "خطأ"}`}
            >
              {toArabicDigits(index + 1)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {passed && result.certificateCode && (
          <Link href={`/certificates/${result.certificateCode}` as Route} className={buttonClass("gold", "lg")}>
            <Award aria-hidden /> عرض الشهادة
          </Link>
        )}
        {!passed && (
          <Link href={`/tasmee`} className={buttonClass("primary", "lg")}>
            راجع بالتسميع
          </Link>
        )}
        <Link href="/exams" className={buttonClass(passed ? "light" : "outline", "lg")}>
          كل الاختبارات
        </Link>
      </div>
      {!passed && <p className="mt-4 text-sm text-muted">يمكنك إعادة اختبار الجزء {toArabicDigits(juz)} بعد انتهاء مدة الانتظار.</p>}
    </motion.section>
  );
}

export function ExamRunner({ attemptId, juz, questions, expiresAt, surahNames }: ExamRunnerProps) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<SubmitExamResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const now = useNow();

  function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startSubmit(async () => {
      const outcome = await submitExamAction(attemptId, answersRef.current);
      if (outcome.error && !outcome.status) submittedRef.current = false;
      setResult(outcome);
    });
  }

  useEffect(() => {
    const timer = setTimeout(submit, Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- schedule once per attempt
  }, [expiresAt]);

  useEffect(() => {
    if (result?.status) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [result]);

  if (result?.status) return <ExamResult result={result} juz={juz} />;

  const question = questions[index]!;
  const answeredCount = answers.filter((answer) => answer >= 0).length;
  const remaining = now ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000)) : null;

  function choose(option: number) {
    const next = answers.map((answer, i) => (i === index ? option : answer));
    answersRef.current = next;
    setAnswers(next);
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-[calc(var(--header-h,4.5rem)+0.5rem)] z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
        <p className="text-sm font-bold text-ink">
          السؤال {toArabicDigits(index + 1)} من {toArabicDigits(questions.length)} · أجبت عن {toArabicDigits(answeredCount)}
        </p>
        <p
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-lg font-bold",
            remaining !== null && remaining < 120 ? "bg-rose/10 text-rose" : "bg-emerald-mist text-emerald-deep",
          )}
          role="timer"
          aria-label="الوقت المتبقي"
        >
          <Clock className="size-4" aria-hidden /> {remaining === null ? "--:--" : toArabicDigits(formatDuration(remaining))}
        </p>
      </div>

      {result?.error && <FormAlert error={result.error} />}

      <AnimatePresence mode="wait">
        <motion.section
          key={question.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          className="rounded-4xl border border-line bg-white p-5 shadow-soft sm:p-8"
        >
          <h2 className="text-lg font-bold text-gold-deep">{QUESTION_TITLES[question.type]}</h2>
          <p className="quran-text mt-4 rounded-3xl bg-ivory p-5 text-center text-2xl leading-[2.3] text-emerald-deep sm:text-3xl sm:leading-[2.4]">
            {question.prompt}
            {(question.type === "next" || question.type === "missing") && (
              <span className="ayah-mark"> ﴿{toArabicDigits(question.ayah)}﴾</span>
            )}
          </p>
          {question.type !== "surah" && (
            <p className="mt-2 text-center text-xs text-muted">{surahNames[question.surah] ? `سورة ${surahNames[question.surah]}` : ""}</p>
          )}
          <div className="mt-6 grid gap-3" role="radiogroup" aria-label="الاختيارات">
            {question.options.map((option, optionIndex) => {
              const selected = answers[index] === optionIndex;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(optionIndex)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-start transition-colors",
                    selected ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                    question.type === "surah" ? "font-bold" : "quran-text text-xl leading-loose",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border-2 font-sans text-xs",
                      selected ? "border-emerald bg-emerald text-white" : "border-line",
                    )}
                  >
                    {selected && <Check className="size-4" aria-hidden />}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          className={buttonClass("outline", "md")}
        >
          <ChevronRight aria-hidden /> السابق
        </button>
        {index < questions.length - 1 ? (
          <button type="button" onClick={() => setIndex((value) => value + 1)} className={buttonClass("primary", "md")}>
            التالي <ChevronLeft aria-hidden />
          </button>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={buttonClass("gold", "md")}>
            <Send aria-hidden /> تسليم الاختبار
          </button>
        )}
      </div>

      <nav aria-label="الانتقال بين الأسئلة" className="flex flex-wrap justify-center gap-2">
        {questions.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-current={i === index ? "step" : undefined}
            aria-label={`السؤال ${i + 1}${answers[i]! >= 0 ? " (تمت الإجابة)" : ""}`}
            className={cn(
              "grid size-9 place-items-center rounded-xl text-sm font-bold",
              i === index
                ? "bg-emerald-deep text-white"
                : answers[i]! >= 0
                  ? "bg-emerald-soft text-emerald-deep"
                  : "border border-line bg-white text-muted",
            )}
          >
            {toArabicDigits(i + 1)}
          </button>
        ))}
      </nav>

      {confirming && (
        <div className="rounded-3xl border border-gold/40 bg-gold-mist p-5 text-center" role="alertdialog" aria-label="تأكيد التسليم">
          <p className="font-bold">
            {answeredCount < questions.length ? `لم تُجب عن ${toArabicDigits(questions.length - answeredCount)} سؤال. ` : ""}هل تريد تسليم
            الاختبار الآن؟
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" onClick={submit} disabled={submitting} className={buttonClass("primary", "md")}>
              {submitting && <Loader2 className="animate-spin" aria-hidden />} نعم، سلّم
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={buttonClass("ghost", "md")}>
              تابع الإجابة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
