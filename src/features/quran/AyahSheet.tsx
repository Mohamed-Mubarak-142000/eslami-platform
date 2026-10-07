"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkCheck, BookmarkPlus, Check, Copy, Loader2, Pause, Play, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { toArabicDigits } from "@/lib/arabic";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { playRecitationFrom } from "./recitation";
import { AyahNumber } from "./AyahNumber";
import type { Ayah } from "./textApi";

interface AyahSheetProps {
  surahId: number;
  surahName: string;
  ayah: Ayah | null;
  tafsir: string | undefined;
  onClose: () => void;
  /**
   * Per-ayah audio, memorization progress and the tafsir all follow Hafs ayah numbering, which
   * another riwaya's mushaf may not share, so they're offered for Hafs only.
   */
  hafs: boolean;
  /** The typeface of the riwaya's own mushaf; null for Hafs. */
  riwayaFont: string | null;
  /** Names for the recitation as it moves on into the next surahs. */
  surahNames: Record<number, string>;
}

export function AyahSheet({ surahId, surahName, ayah, tafsir, onClose, hafs, riwayaFont, surahNames }: AyahSheetProps) {
  const audio = useAudio();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const progress = useKidsProgress();
  const learner = useActiveLearner();
  const memorized = ayah ? (progress.state.memorizedAyahsBySurah[surahId] ?? []).includes(ayah.numberInSurah) : false;
  const forWhom = learner?.kind === "child" ? ` — لملف ${learner.display_name}` : "";

  useEffect(() => {
    if (!ayah) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ayah, onClose]);

  const trackId = ayah ? `ayah-${ayah.number}` : "";
  const isThis = audio.isCurrent(trackId);
  const reference = ayah ? `سورة ${surahName} — الآية ${toArabicDigits(ayah.numberInSurah)}` : "";

  async function copy() {
    if (!ayah) return;
    try {
      await navigator.clipboard.writeText(`${ayah.text} ﴿${toArabicDigits(ayah.numberInSurah)}﴾\n[${reference}]`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (permissions/insecure context) — nothing to recover.
    }
  }

  function playAyah() {
    if (!ayah) return;
    if (isThis) {
      audio.toggle();
      return;
    }
    // Goes on ayah after ayah; the reader follows and turns the page.
    playRecitationFrom(audio, ayah.number, surahNames);
  }

  return (
    <AnimatePresence>
      {ayah && (
        <>
          <motion.button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={reference}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80dvh] max-w-2xl overflow-y-auto rounded-t-4xl bg-ivory p-6 text-ink shadow-lift sm:p-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-line" aria-hidden />
            <div className="flex items-start justify-between gap-4">
              <p className="rounded-full bg-gold-mist px-3 py-1 text-sm font-bold text-gold-deep">{reference}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="grid size-10 place-items-center rounded-full hover:bg-emerald-mist"
                aria-label="إغلاق"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <p
              className="quran-text mt-5 text-center text-3xl leading-[2.4] text-emerald-deep"
              style={riwayaFont ? { fontFamily: riwayaFont } : undefined}
            >
              {ayah.text} <AyahNumber number={ayah.numberInSurah} riwayaFont={riwayaFont} />
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {hafs && (
                <button type="button" onClick={playAyah} className={buttonClass("primary", "md")}>
                  {isThis && audio.loading ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : isThis && audio.playing ? (
                    <Pause aria-hidden className="fill-current" />
                  ) : (
                    <Play aria-hidden className="fill-current" />
                  )}
                  استمع من هنا
                </button>
              )}
              <button type="button" onClick={copy} className={buttonClass("outline", "md")}>
                {copied ? <Check aria-hidden className="text-emerald" /> : <Copy aria-hidden />}
                {copied ? "تم النسخ" : "انسخ مع المرجع"}
              </button>
              {hafs && (
                <button
                  type="button"
                  aria-pressed={memorized}
                  onClick={() => ayah && progress.setAyahMemorized(surahId, ayah.numberInSurah, !memorized)}
                  className={buttonClass(memorized ? "gold" : "outline", "md")}
                >
                  {memorized ? <BookmarkCheck aria-hidden /> : <BookmarkPlus aria-hidden />}
                  {memorized ? "محفوظة" : "حفظتُ هذه الآية"}
                </button>
              )}
            </div>
            {hafs ? (
              <>
                <p className="mt-3 text-center text-xs text-muted">
                  {progress.synced ? `يُسجَّل حفظك في حسابك${forWhom}.` : "يُسجَّل حفظك على هذا الجهاز — سجّل الدخول ليُحفظ في حسابك."}
                </p>
                <section className="mt-7 rounded-3xl border border-line bg-white p-5">
                  <h3 className="text-sm font-bold text-gold-deep">التفسير الميسّر</h3>
                  <p className="mt-2 leading-9 text-ink/85">{tafsir ?? "التفسير غير متاح لهذه الآية الآن."}</p>
                </section>
              </>
            ) : (
              <p className="mt-6 rounded-3xl border border-line bg-white p-5 text-center text-sm leading-7 text-ink/80">
                التفسير وتسجيل الحفظ والاستماع للآية متاحة في رواية حفص، لأن ترقيم الآيات يختلف بين الروايات.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
