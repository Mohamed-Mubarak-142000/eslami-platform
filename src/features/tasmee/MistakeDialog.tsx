"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Pause, Play, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "@/features/quran/ayahAudio";
import type { Ayah } from "@/features/quran/textApi";
import type { ExpectedWord, Mistake } from "./recitation";

function AyahText({ words, highlight, numberInSurah }: { words: string[]; highlight: Set<number>; numberInSurah: number }) {
  return (
    <p className="quran-text text-center text-2xl leading-[2.3] text-emerald-deep sm:text-3xl">
      {words.map((word, index) => (
        <span key={index}>
          <span className={cn(highlight.has(index) && "rounded-lg bg-emerald-mist px-1 text-emerald ring-2 ring-emerald/40")}>
            {word}
          </span>{" "}
        </span>
      ))}
      <span className="ayah-mark">﴿{toArabicDigits(numberInSurah)}﴾</span>
    </p>
  );
}

/**
 * Stops the recitation on a mistake: what was said, what's right, and the ayah to read again.
 * Closing it resumes listening; "كنت صحيحًا" covers the recognizer mishearing.
 */
export function MistakeDialog({
  mistake,
  expected,
  ayahs,
  words,
  surah,
  onContinue,
  onOverride,
}: {
  mistake: Mistake;
  expected: ExpectedWord[];
  ayahs: Ayah[];
  words: string[][];
  surah: { id: number; name: string };
  onContinue: () => void;
  onOverride: () => void;
}) {
  const audio = useAudio();
  const continueRef = useRef<HTMLButtonElement>(null);
  const at = expected[mistake.at]!;
  const ayah = ayahs[at.ayah]!;
  const trackId = `tasmee-fix-${ayah.number}`;
  const isThis = audio.isCurrent(trackId);

  useEffect(() => {
    continueRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onContinue();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  const ayahNumber = toArabicDigits(ayah.numberInSurah);
  let title: string;
  let highlight: Set<number>;
  let detail: React.ReactNode;
  if (mistake.kind === "wrong") {
    title = `خطأ في الآية ${ayahNumber}`;
    highlight = new Set([at.word]);
    detail = (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-rose/10 p-3 text-center">
          <p className="text-xs font-bold text-rose">قلتَ</p>
          <p className="mt-1 text-xl font-bold text-rose line-through decoration-2">{mistake.heard}</p>
        </div>
        <div className="rounded-2xl bg-emerald-mist p-3 text-center">
          <p className="text-xs font-bold text-emerald">الصحيح</p>
          <p className="quran-text mt-1 text-2xl text-emerald-deep">{at.text}</p>
        </div>
      </div>
    );
  } else if (mistake.kind === "missed") {
    const missed = expected.slice(mistake.at, mistake.at + mistake.count).filter((word) => word.ayah === at.ayah);
    title = `نقصت كلمة في الآية ${ayahNumber}`;
    highlight = new Set(missed.map((word) => word.word));
    detail = (
      <div className="rounded-2xl bg-emerald-mist p-3 text-center">
        <p className="text-xs font-bold text-emerald">لم نسمع</p>
        <p className="quran-text mt-1 text-2xl text-emerald-deep">{missed.map((word) => word.text).join(" ")}</p>
      </div>
    );
  } else {
    const skippedTo = expected[mistake.resumeAt];
    title = `تجاوزتَ الآية ${ayahNumber}`;
    highlight = new Set();
    detail = (
      <p className="rounded-2xl bg-gold-mist p-3 text-center text-sm leading-7 text-gold-deep">
        انتقلتَ إلى الآية {toArabicDigits(ayahs[skippedTo?.ayah ?? at.ayah]?.numberInSurah ?? 0)} قبل أن تقرأ هذه الآية. اقرأها ثم أكمل.
      </p>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <motion.div
        className="absolute inset-0 bg-emerald-night/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onContinue}
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mistake-title"
        aria-describedby="mistake-detail"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-4xl bg-ivory p-6 text-ink shadow-lift sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose/10 text-rose">
            <TriangleAlert className="size-6" aria-hidden />
          </span>
          <h2 id="mistake-title" className="text-xl font-bold text-emerald-deep">
            {title}
          </h2>
        </div>
        <div id="mistake-detail" className="mt-5 space-y-5">
          {detail}
          <div className="rounded-3xl border border-line bg-white p-4">
            <p className="mb-2 text-xs font-bold text-muted">
              سورة {surah.name} — الآية {ayahNumber}
            </p>
            <AyahText words={words[at.ayah]!} highlight={highlight} numberInSurah={ayah.numberInSurah} />
          </div>
          <p className="text-sm text-muted">
            {mistake.kind === "skipped-ayah" ? "اقرأ هذه الآية الآن." : "أعد قراءة الكلمة الصحيحة أو الآية من أولها."} سنستمع لك تلقائيًا
            بعد الإغلاق.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button ref={continueRef} type="button" onClick={onContinue} className={buttonClass("primary", "md")}>
            فهمت، أكمل
          </button>
          <button
            type="button"
            onClick={() =>
              isThis
                ? audio.toggle()
                : audio.play({
                    id: trackId,
                    kind: "ayah",
                    title: `سورة ${surah.name} — الآية ${ayahNumber}`,
                    subtitle: "الحصري — مرتّل",
                    src: husaryAyahUrl(ayah.number),
                    href: `/quran/${surah.id}`,
                  })
            }
            className={buttonClass("outline", "md")}
          >
            {isThis && audio.loading ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : isThis && audio.playing ? (
              <Pause className="fill-current" aria-hidden />
            ) : (
              <Play className="fill-current" aria-hidden />
            )}
            استمع للآية
          </button>
          {mistake.kind !== "skipped-ayah" && (
            <button
              type="button"
              onClick={onOverride}
              className="ms-auto text-sm font-bold text-muted underline-offset-4 hover:text-emerald hover:underline"
            >
              قرأتها صحيحة، أكمل
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
