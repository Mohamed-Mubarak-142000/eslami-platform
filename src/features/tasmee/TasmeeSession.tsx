"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkCheck, Check, Eye, Hand, Lightbulb, Mic, MicOff, Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "@/features/quran/ayahAudio";
import type { Ayah } from "@/features/quran/textApi";
import { splitAyahWords } from "@/features/kids/games/arrangeGameLogic";
import { ReciteRecorder } from "@/features/kids/ReciteRecorder";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { getDueReviews } from "@/features/kids/progress/reviewSchedule";
import { getSurahAyahCount } from "@/features/kids/progress/surahAyahCounts";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildExpected, matchChunk, matchPreview, type Mistake } from "./recitation";
import { useSpeechRecognition, useSpeechSupported, type SpeechError } from "./useSpeechRecognition";
import { playErrorTone, unlockErrorTone } from "./errorTone";
import { MistakeDialog } from "./MistakeDialog";

type Mode = "voice" | "manual";

const SPEECH_ERRORS: Record<SpeechError, string> = {
  "not-allowed": "لم نستطع استخدام الميكروفون. اسمح للموقع بالوصول إليه من إعدادات المتصفح ثم حاول مرة أخرى.",
  network: "التعرّف على الصوت يحتاج اتصالًا بالإنترنت. تحقّق من الاتصال ثم حاول مرة أخرى.",
  unsupported: "متصفحك لا يدعم التعرّف على الصوت. استخدم Chrome أو Edge أو Safari، أو سمّع يدويًا.",
  other: "توقّف الاستماع بشكل غير متوقع. اضغط «تابع» لنكمل.",
};

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
  const audio = useAudio();
  const [sessionAyahs, setSessionAyahs] = useState(ayahs);
  const [items, setItems] = useState(() => initialState(ayahs));
  const [hintFirstWord, setHintFirstWord] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [markedMemorized, setMarkedMemorized] = useState(false);
  const [countedAsReview, setCountedAsReview] = useState(false);
  const currentRef = useRef<HTMLLIElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Voice mode: the words heard so far are matched against the ayahs; a mistake stops and explains.
  const supported = useSpeechSupported();
  const [modeChoice, setModeChoice] = useState<Mode | null>(null);
  const mode: Mode = modeChoice ?? (supported ? "voice" : "manual");
  const expected = useMemo(() => buildExpected(sessionAyahs.map((ayah) => splitAyahWords(ayah.text))), [sessionAyahs]);
  const ayahStarts = useMemo(() => {
    const starts: number[] = [];
    expected.forEach((word, index) => {
      if (word.word === 0) starts[word.ayah] = index;
    });
    return starts;
  }, [expected]);
  const [pos, setPos] = useState(0);
  const [preview, setPreview] = useState(0);
  const [interim, setInterim] = useState("");
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const posRef = useRef(0);
  const mistakeRef = useRef<Mistake | null>(null);
  const errorAyahsRef = useRef(new Set<number>());
  const [started, setStarted] = useState(false);

  const ayahEnd = useCallback((index: number) => (ayahStarts[index + 1] ?? expected.length) - 1, [ayahStarts, expected.length]);

  function advanceTo(next: number) {
    posRef.current = next;
    setPos(next);
    const marks = new Map<number, Mark>();
    itemsRef.current.forEach((item, index) => {
      if (item.mark === null && ayahEnd(index) < next) marks.set(index, errorAyahsRef.current.has(index) ? "mistake" : "correct");
    });
    if (marks.size > 0) markMany(marks);
  }

  const speech = useSpeechRecognition({
    onFinal: (text) => {
      if (mistakeRef.current) return;
      const result = matchChunk(expected, text, posRef.current);
      advanceTo(result.pos);
      setPreview(result.pos);
      if (result.mistake) {
        mistakeRef.current = result.mistake;
        setMistake(result.mistake);
        errorAyahsRef.current.add(expected[result.mistake.at]!.ayah);
        speech.stop();
        playErrorTone();
      } else if (result.pos >= expected.length) {
        speech.stop();
      }
    },
    onInterim: (text) => {
      setInterim(text);
      if (!mistakeRef.current) setPreview(text ? matchPreview(expected, text, posRef.current) : posRef.current);
    },
  });

  // The mic would hear the reciter: playing an ayah pauses listening.
  const { stop: stopListening, listening } = speech;
  useEffect(() => {
    if (audio.playing && listening) stopListening();
  }, [audio.playing, listening, stopListening]);

  function listen() {
    unlockErrorTone();
    if (audio.playing) audio.pause();
    setStarted(true);
    speech.start();
  }

  function closeMistake(override: boolean) {
    const current = mistakeRef.current;
    mistakeRef.current = null;
    setMistake(null);
    if (current && override) {
      // The recognizer misheard: accept the word(s) and move on.
      errorAyahsRef.current.delete(expected[current.at]!.ayah);
      advanceTo(current.kind === "wrong" ? current.at + 1 : current.kind === "missed" ? current.at + current.count : posRef.current);
    }
    if (audio.playing) audio.pause();
    if (posRef.current < expected.length) setTimeout(listen, 250);
  }

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
    markMany(new Map([[index, value]]));
  }

  function markMany(marks: Map<number, Mark>) {
    const next = itemsRef.current.map((item, i) => {
      const value = marks.get(i);
      return value ? { ...item, mark: value, revealed: item.words.length } : item;
    });
    itemsRef.current = next;
    setItems(next);
    if (next.every((item) => item.mark !== null)) {
      void save(next);
      const wholeSurah = next.length === getSurahAyahCount(surah.id);
      const isDue = getDueReviews(progress.state.reviewSchedule).some((entry) => entry.surahId === surah.id);
      if (wholeSurah && isDue && next.every((item) => item.mark === "correct")) {
        progress.markSurahReviewed(surah.id);
        setCountedAsReview(true);
      }
    }
  }

  function restart(onlyMistakes: boolean) {
    const subset = onlyMistakes && mistakes.length > 0 ? mistakes.map((item) => item.ayah) : ayahs;
    speech.stop();
    setSessionAyahs(subset);
    const fresh = initialState(subset);
    itemsRef.current = fresh;
    setItems(fresh);
    posRef.current = 0;
    setPos(0);
    setPreview(0);
    mistakeRef.current = null;
    setMistake(null);
    errorAyahsRef.current = new Set();
    setStarted(false);
    setSaved("idle");
    setMarkedMemorized(false);
    setCountedAsReview(false);
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

      <div role="radiogroup" aria-label="طريقة التسميع" className="grid grid-cols-2 gap-2 rounded-3xl bg-emerald-mist p-1.5">
        {(
          [
            ["voice", Mic, "بصوتك (تلقائي)"],
            ["manual", Hand, "يدويًا"],
          ] as const
        ).map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => {
              if (value === "manual") speech.stop();
              setModeChoice(value);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
              mode === value ? "bg-white text-emerald-deep shadow-soft" : "text-muted hover:text-emerald-deep",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-emerald-mist" aria-hidden>
        <motion.div className="h-full rounded-full bg-emerald" animate={{ width: `${(answered / items.length) * 100}%` }} />
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          const upcoming = !finished && index > currentIndex;
          const heard = mode === "voice" ? Math.min(Math.max(Math.max(pos, preview) - (ayahStarts[index] ?? 0), 0), item.words.length) : 0;
          const shownCount = Math.max(item.revealed, heard, hintFirstWord && (isCurrent || upcoming) ? 1 : 0);
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
                  {mode === "manual" && (
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
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!finished && mode === "manual" && (
        <div className="rounded-3xl border border-dashed border-line bg-ivory p-5 text-center">
          <p className="mb-3 text-sm text-muted">اختياري: سجّل تلاوتك واستمع لها لتكتشف أخطاءك (يبقى التسجيل على جهازك فقط).</p>
          <ReciteRecorder variant="site" />
        </div>
      )}

      {mode === "voice" && !finished && (
        <div className="sticky bottom-4 z-20 rounded-3xl border border-emerald/20 bg-white/95 p-4 shadow-lift backdrop-blur sm:p-5">
          {!supported ? (
            <p className="text-sm text-rose">{SPEECH_ERRORS.unsupported}</p>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => (speech.listening ? speech.stop() : listen())}
                disabled={mistake !== null}
                className={cn(
                  "relative grid size-14 shrink-0 place-items-center rounded-full text-white shadow-lift transition-colors disabled:opacity-50",
                  speech.listening ? "bg-rose" : "bg-emerald hover:bg-emerald-deep",
                )}
                aria-label={speech.listening ? "أوقف الاستماع" : "ابدأ التسميع بصوتك"}
              >
                {speech.listening && <span className="absolute inset-0 animate-ping rounded-full bg-rose/30" aria-hidden />}
                {speech.listening ? <MicOff className="relative size-6" aria-hidden /> : <Mic className="size-6" aria-hidden />}
              </button>
              <div className="min-w-0 flex-1" aria-live="polite">
                <p className="font-bold text-emerald-deep">
                  {speech.listening
                    ? "أستمع إليك… اقرأ من حفظك"
                    : started
                      ? "توقّف الاستماع — اضغط الميكروفون لتتابع"
                      : "اضغط الميكروفون وابدأ القراءة من حفظك"}
                </p>
                <p className={cn("mt-0.5 text-sm", speech.error ? "text-rose" : "truncate text-muted")}>
                  {speech.error
                    ? SPEECH_ERRORS[speech.error]
                    : interim || "تظهر كل آية وأنت تقرؤها، ونوقفك عند أي خطأ ونريك الصحيح. لا نحكم على التشكيل والتجويد."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {mistake && (
        <MistakeDialog
          mistake={mistake}
          expected={expected}
          ayahs={sessionAyahs}
          words={items.map((item) => item.words)}
          surah={surah}
          onContinue={() => closeMistake(false)}
          onOverride={() => closeMistake(true)}
        />
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
          {countedAsReview && <p className="mt-3 text-sm font-bold text-gold-soft">سُجّلت مراجعة السورة لليوم ✓</p>}
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
