"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Loader2, Pause, Play, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { toArabicDigits } from "@/lib/arabic";
import { husaryAyahUrl } from "./ayahAudio";
import type { Ayah } from "./textApi";

interface AyahSheetProps {
  surahId: number;
  surahName: string;
  ayah: Ayah | null;
  tafsir: string | undefined;
  onClose: () => void;
}

export function AyahSheet({ surahId, surahName, ayah, tafsir, onClose }: AyahSheetProps) {
  const audio = useAudio();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

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
    audio.play({
      id: trackId,
      kind: "ayah",
      title: reference,
      subtitle: "الحصري — مرتّل",
      src: husaryAyahUrl(ayah.number),
      href: `/quran/${surahId}`,
    });
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
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80dvh] max-w-2xl overflow-y-auto rounded-t-[2rem] bg-ivory p-6 text-ink shadow-lift sm:p-8"
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
            <p className="quran-text mt-5 text-center text-3xl leading-[2.4] text-emerald-deep">
              {ayah.text} <span className="ayah-mark">﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={playAyah} className={buttonClass("primary", "md")}>
                {isThis && audio.loading ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : isThis && audio.playing ? (
                  <Pause aria-hidden className="fill-current" />
                ) : (
                  <Play aria-hidden className="fill-current" />
                )}
                استمع للآية
              </button>
              <button type="button" onClick={copy} className={buttonClass("outline", "md")}>
                {copied ? <Check aria-hidden className="text-emerald" /> : <Copy aria-hidden />}
                {copied ? "تم النسخ" : "انسخ مع المرجع"}
              </button>
            </div>
            <section className="mt-7 rounded-3xl border border-line bg-white p-5">
              <h3 className="text-sm font-bold text-gold-deep">التفسير الميسّر</h3>
              <p className="mt-2 leading-9 text-ink/85">{tafsir ?? "التفسير غير متاح لهذه الآية الآن."}</p>
            </section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
