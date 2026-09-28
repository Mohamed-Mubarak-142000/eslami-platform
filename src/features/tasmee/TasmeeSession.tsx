"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkCheck, Check, Eye, Lightbulb, Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "@/features/quran/ayahAudio";
import type { Ayah } from "@/features/quran/textApi";
import { splitAyahWords } from "@/features/kids/games/arrangeGameLogic";
import { ReciteRecorder } from "@/features/kids/ReciteRecorder";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mark = "correct" | "mistake";

interface AyahState {
  ayah: Ayah;
  words: string[];
  revealed: number;
  mark: Mark | null;
}

function initialState(ayahs: Ayah[]): AyahState[] {
  return ayahs.map((ayah) => ({ ayah, words: splitAyahWords(ayah.text), revealed: 0, mark: null }));
}

/** A hidden word keeps its real text (transparent) so the placeholder is exactly its width. */
function Word({ text, shown }: { text: string; shown: boolean }) {
  if (shown) return <span>{text}</span>;
  return (
    <span className="rounded-lg bg-emerald-soft/70 text-transparent select-none" aria-hidden>
      {text}
    </span>
  );
}

function AyahPlay({ ayah, surahId, surahName }: { ayah: Ayah; surahId: number; surahName: string }) {
  const audio = useAudio();
  const id = `ayah-${ayah.number}`;
  const playing = audio.isCurrent(id) && audio.playing;
  return (
    <button
      type="button"
      onClick={() =>
        audio.isCurrent(id)
          ? audio.toggle()
          : audio.play({
              id,
              kind: "ayah",
              title: `سورة ${surahName} — الآية ${toArabicDigits(ayah.numberInSurah)}`,
              subtitle: "الحصري — مرتّل",
              src: husaryAyahUrl(ayah.number),
              href: `/quran/${surahId}`,
            })
      }
      className="grid size-9 place-items-center rounded-full text-emerald hover:bg-emerald-mist"
      aria-label={playing ? "إيقاف" : "استمع للآية"}
    >
      {playing ? <Pause className="size-4 fill-current" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
    </button>
  );
}

export function TasmeeSession({ surah, ayahs }: { surah: { id: number; name: string }; ayahs: Ayah[] }) {
  const progress = useKidsProgress();
  const learner = useActiveLearner();
  const [items, setItems] = useState(() => initialState(ayahs));
  const [hintFirstWord, setHintFirstWord] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [markedMemorized, setMarkedMemorized] = useState(false);
  const currentRef = useRef<HTMLLIElement>(null);

  const currentIndex = items.findIndex((item) => item.mark === null);
  const finished = currentIndex === -1;
  const correct = items.filter((item) => item.mark === "correct");
  const mistakes = items.filter((item) => item.mark === "mistake");

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex]);

  function update(index: number, change: Partial<AyahState>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...change } : item)));
  }

  async function save(final: AyahState[]) {
    const supabase = getSupabaseBrowserClient();
    if (!learner || !supabase) return;
    setSaved("saving");
    const numbers = final.map((item) => item.ayah.numberInSurah);
    const { error } = await supabase.from("tasmee_sessions").insert({
      learner_id: learner.id,
      surah: surah.id,
      ayah_from: Math.min(...numbers),
      ayah_to: Math.max(...numbers),
      correct: final.filter((item) => item.mark === "correct").length,
      mistakes: final.filter((item) => item.mark === "mistake").length,
    });
    setSaved(error ? "failed" : "saved");
  }

  function mark(index: number, value: Mark) {
    const next = items.map((item, i) => (i === index ? { ...item, mark: value, revealed: item.words.length } : item));
    setItems(next);
    if (next.every((item) => item.mark !== null)) void save(next);
  }

  function restart(onlyMistakes: boolean) {
    const subset = onlyMistakes ? mistakes.map((item) => item.ayah) : ayahs;
    setItems(initialState(subset.length > 0 ? subset : ayahs));
    setSaved("idle");
    setMarkedMemorized(false);
  }

  const answered = correct.length + mistakes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-emerald-deep">سورة {surah.name}</h2>
          <p className="text-sm text-muted">
            {toArabicDigits(answered)} من {toArabicDigits(items.length)} آية
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={hintFirstWord}
            onChange={(event) => setHintFirstWord(event.target.checked)}
            className="size-4 accent-emerald"
          />
          <Lightbulb className="size-4 text-gold-deep" aria-hidden /> أظهر أول كلمة من كل آية
        </label>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-emerald-mist" aria-hidden>
        <motion.div className="h-full rounded-full bg-emerald" animate={{ width: `${(answered / items.length) * 100}%` }} />
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          const upcoming = !finished && index > currentIndex;
          const shownCount = Math.max(item.revealed, hintFirstWord && (isCurrent || upcoming) ? 1 : 0);
          return (
            <li
              key={item.ayah.number}
              ref={isCurrent ? currentRef : undefined}
              className={cn(
                "rounded-3xl border bg-white p-4 transition-[opacity,box-shadow] sm:p-5",
                isCurrent ? "border-emerald/40 shadow-lift" : "border-line",
                upcoming && "opacity-55",
                item.mark === "correct" && "border-emerald/30 bg-emerald-mist/40",
                item.mark === "mistake" && "border-rose/30 bg-rose/5",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-2 grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
                    item.mark === "correct"
                      ? "bg-emerald text-white"
                      : item.mark === "mistake"
                        ? "bg-rose text-white"
                        : "bg-gold-mist text-gold-deep",
                  )}
                  aria-label={item.mark === "correct" ? "صحيحة" : item.mark === "mistake" ? "للمراجعة" : undefined}
                >
                  {item.mark === "correct" ? (
                    <Check className="size-4" aria-hidden />
                  ) : item.mark === "mistake" ? (
                    <X className="size-4" aria-hidden />
                  ) : (
                    toArabicDigits(item.ayah.numberInSurah)
                  )}
                </span>
                <p className="quran-text flex-1 text-2xl leading-[2.3] text-emerald-deep sm:text-3xl sm:leading-[2.4]">
                  {shownCount < item.words.length && <span className="sr-only">الآية {toArabicDigits(item.ayah.numberInSurah)} مخفية</span>}
                  {item.words.map((word, wordIndex) => (
                    <span key={wordIndex}>
                      <Word text={word} shown={wordIndex < shownCount} />{" "}
                    </span>
                  ))}
                  <span className="ayah-mark">﴿{toArabicDigits(item.ayah.numberInSurah)}﴾</span>
                </p>
                {item.mark && <AyahPlay ayah={item.ayah} surahId={surah.id} surahName={surah.name} />}
              </div>

              {isCurrent && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => update(index, { revealed: Math.min(shownCount + 1, item.words.length) })}
                    disabled={shownCount >= item.words.length}
                    className={buttonClass("outline", "sm")}
                  >
                    <SkipForward aria-hidden /> اكشف كلمة
                  </button>
                  <button
                    type="button"
                    onClick={() => update(index, { revealed: item.words.length })}
                    disabled={shownCount >= item.words.length}
                    className={buttonClass("outline", "sm")}
                  >
                    <Eye aria-hidden /> اكشف الآية
                  </button>
                  <span className="ms-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => mark(index, "mistake")}
                      className={buttonClass("outline", "sm", "border-rose/40 text-rose hover:bg-rose/10")}
                    >
                      <X aria-hidden /> أخطأت
                    </button>
                    <button type="button" onClick={() => mark(index, "correct")} className={buttonClass("primary", "sm")}>
                      <Check aria-hidden /> قرأتها صحيحة
                    </button>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!finished && (
        <div className="rounded-3xl border border-dashed border-line bg-ivory p-5 text-center">
          <p className="mb-3 text-sm text-muted">اختياري: سجّل تلاوتك واستمع لها لتكتشف أخطاءك (يبقى التسجيل على جهازك فقط).</p>
          <ReciteRecorder variant="site" />
        </div>
      )}

      {finished && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl bg-emerald-deep p-6 text-white shadow-lift sm:p-8"
          aria-live="polite"
        >
          <h2 className="text-2xl font-bold">انتهى التسميع — بارك الله فيك</h2>
          <p className="mt-2 text-white/80">
            <span className="font-bold text-gold-soft">{toArabicDigits(correct.length)}</span> آية صحيحة
            {mistakes.length > 0 && (
              <>
                {" "}
                و<span className="font-bold text-rose">{toArabicDigits(mistakes.length)}</span> للمراجعة
              </>
            )}{" "}
            من {toArabicDigits(items.length)}.
          </p>
          {mistakes.length > 0 && (
            <p className="mt-2 text-sm text-white/70">
              راجع الآيات: {mistakes.map((item) => toArabicDigits(item.ayah.numberInSurah)).join("، ")}
            </p>
          )}
          <p className="mt-3 text-xs text-white/60">
            {learner
              ? saved === "saving"
                ? "جارٍ حفظ الجلسة في حسابك..."
                : saved === "saved"
                  ? "حُفظت الجلسة في رحلتك."
                  : saved === "failed"
                    ? "تعذّر حفظ الجلسة."
                    : ""
              : "سجّل الدخول لتُحفظ جلسات التسميع في حسابك."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {correct.length > 0 && (
              <button
                type="button"
                disabled={markedMemorized}
                onClick={() => {
                  progress.setAyahsMemorized(
                    surah.id,
                    correct.map((item) => item.ayah.numberInSurah),
                    true,
                  );
                  setMarkedMemorized(true);
                }}
                className={buttonClass("gold", "md")}
              >
                <BookmarkCheck aria-hidden /> {markedMemorized ? "سُجّلت كمحفوظة" : "علّم الصحيحة كمحفوظة"}
              </button>
            )}
            {mistakes.length > 0 && (
              <button type="button" onClick={() => restart(true)} className={buttonClass("light", "md")}>
                <RotateCcw aria-hidden /> سمّع آيات المراجعة فقط
              </button>
            )}
            <button type="button" onClick={() => restart(false)} className={buttonClass("light", "md")}>
              <RotateCcw aria-hidden /> من جديد
            </button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
