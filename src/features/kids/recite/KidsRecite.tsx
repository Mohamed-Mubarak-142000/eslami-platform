"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, SkipForward, ThumbsUp, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "@/features/quran/ayahAudio";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { buildExpected, matchChunk, matchPreview } from "@/features/tasmee/recitation";
import { useSpeechRecognition, useSpeechSupported } from "@/features/tasmee/useSpeechRecognition";
import { splitAyahWords } from "../games/arrangeGameLogic";
import { ReciteRecorder } from "../ReciteRecorder";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { useCompanion } from "../companion/CompanionProvider";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";

/** Good enough for the mission step: at least this share of the recited ayahs went well. */
const PASS_SHARE = 0.7;
/** After this many ayahs a child may finish early (long surahs like An-Naba). */
const MIN_AYAHS_TO_FINISH = 3;

type Verdict = "excellent" | "good" | "again";

const VERDICTS: Record<Verdict, { emoji: string; title: string; stars: number }> = {
  excellent: { emoji: "⭐", title: "ممتاز!", stars: 3 },
  good: { emoji: "👏", title: "أحسنت!", stars: 2 },
  again: { emoji: "🔄", title: "نسمعها مرة كمان سوا؟", stars: 1 },
};

function verdictFor(slips: number): Verdict {
  return slips === 0 ? "excellent" : slips <= 1 ? "good" : "again";
}

export function KidsRecite({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const supported = useSpeechSupported();
  const audio = useAudio();
  const learner = useActiveLearner();
  const { recordGame } = useKidsProgress();
  const { react, setMood } = useCompanion();
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(0);
  const [preview, setPreview] = useState(0);
  const [slips, setSlips] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [results, setResults] = useState<Verdict[]>([]);
  const [finished, setFinished] = useState(false);
  const posRef = useRef(0);
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  });

  const ayah = ayahs[index];
  const words = useMemo(() => (ayah ? splitAyahWords(ayah.text) : []), [ayah]);
  const expected = useMemo(() => buildExpected([words]), [words]);

  const speech = useSpeechRecognition({
    onInterim: (text) => setPreview(text ? matchPreview(expected, text, posRef.current) : posRef.current),
    onFinal: (text) => {
      const result = matchChunk(expected, text, posRef.current);
      posRef.current = result.pos;
      setPos(result.pos);
      setPreview(result.pos);
      // A slip is never shown on the words: the child simply carries on from where they are.
      if (result.mistake) setSlips((value) => value + 1);
      if (result.pos >= expected.length) finishAyah(result.mistake ? slips + 1 : slips);
    },
  });

  useEffect(
    () => () => {
      setMood("idle");
      if (audioRef.current.track?.id.startsWith("kids-")) audioRef.current.stop();
    },
    [setMood],
  );

  function resetAyah() {
    posRef.current = 0;
    setPos(0);
    setPreview(0);
    setSlips(0);
    setVerdict(null);
  }

  /** Trying an ayah again replaces its last result instead of adding one. */
  function retry() {
    sfx.tap();
    setResults((current) => current.slice(0, -1));
    resetAyah();
  }

  function finishAyah(finalSlips: number) {
    speech.stop();
    const next = verdictFor(finalSlips);
    setVerdict(next);
    setResults((current) => [...current, next]);
    if (next === "again") {
      sfx.flip();
      react("almost");
    } else {
      sfx.correct();
      react("correct");
    }
  }

  function listenFirst() {
    if (!ayah) return;
    speech.stop();
    audio.play({
      id: `kids-recite-${ayah.number}`,
      kind: "ayah",
      title: `سورة ${surah.name}`,
      subtitle: "سمّعني",
      src: husaryAyahUrl(ayah.number),
    });
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      setMood("idle");
      return;
    }
    if (audio.playing) audio.pause();
    sfx.tap();
    setMood("thinking");
    react("listening", "thinking");
    speech.start();
  }

  async function saveSession(all: Verdict[]) {
    const good = all.filter((entry) => entry !== "again").length;
    recordGame({ game: "kids_recite", surah: good / all.length >= PASS_SHARE ? surah.id : null, score: good, total: all.length });
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !learner) return;
    await supabase.from("tasmee_sessions").insert({
      learner_id: learner.id,
      surah: surah.id,
      ayah_from: 1,
      ayah_to: all.length,
      correct: good,
      mistakes: all.length - good,
    });
  }

  function finishSession(all: Verdict[]) {
    if (all.length === 0) return;
    speech.stop();
    setMood("idle");
    sfx.win();
    setFinished(true);
    void saveSession(all);
  }

  function next() {
    sfx.tap();
    if (index + 1 >= ayahs.length) {
      finishSession(results);
      return;
    }
    setIndex(index + 1);
    resetAyah();
  }

  function skip() {
    // Skipping is fine; it just counts as an ayah to come back to.
    const all = [...results, "again" as const];
    setResults(all);
    if (index + 1 >= ayahs.length) finishSession(all);
    else {
      speech.stop();
      setIndex(index + 1);
      resetAyah();
    }
  }

  function restart() {
    setIndex(0);
    setResults([]);
    setFinished(false);
    resetAyah();
  }

  if (!ayah) {
    return <p className={`${kidsPanel} text-center text-lg text-muted`}>تعذّر تحميل آيات السورة الآن، جرّب بعد قليل.</p>;
  }

  if (!supported) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep">🎤 سمّعني: سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">سجّل صوتك وأنت تقرأ، ثم استمع لنفسك. هل قرأتها جيدًا؟</p>
        <p className="quran-text mt-5 rounded-3xl bg-[#fffaf0] p-4 text-2xl leading-loose">
          {ayahs.map((entry) => entry.text).join(" ۝ ")}
        </p>
        <div className="mt-5">
          <ReciteRecorder />
        </div>
        <button
          type="button"
          onClick={() => {
            sfx.win();
            react("finish");
            recordGame({ game: "kids_recite", surah: surah.id, score: 1, total: 1 });
            setFinished(true);
          }}
          className={kidsButton("emerald", "mt-6")}
        >
          <ThumbsUp aria-hidden /> قرأتها جيدًا!
        </button>
        <Celebration open={finished} title="أحسنت يا بطل!" message="صوتك جميل بالقرآن 🌟" stars={3}>
          <Link href={`/kids/journey/${surah.id}`} className={kidsButton("emerald")}>
            العودة للمحطة
          </Link>
        </Celebration>
      </div>
    );
  }

  const shown = Math.max(pos, preview);
  const good = results.filter((entry) => entry !== "again").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">🎤 سمّعني: سورة {surah.name}</h1>
        <span className="font-extrabold text-muted">
          الآية {toArabicDigits(ayah.numberInSurah)} من {toArabicDigits(ayahs.length)}
        </span>
      </div>

      <section className={cn(kidsPanel, "text-center")}>
        <p className="quran-text flex flex-wrap justify-center gap-x-3 gap-y-1 text-3xl leading-[2.4] sm:text-4xl">
          {words.map((word, wordIndex) => (
            <motion.span
              key={`${ayah.number}-${wordIndex}`}
              animate={wordIndex < shown ? { color: "#0b7a44", scale: [1, 1.12, 1] } : { color: "#3b2f1b", scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              {word}
            </motion.span>
          ))}
        </p>

        <AnimatePresence mode="wait">
          {verdict ? (
            <motion.div key="verdict" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
              <p className="text-5xl" aria-hidden>
                {VERDICTS[verdict].emoji}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-deep">{VERDICTS[verdict].title}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {verdict === "again" && (
                  <>
                    <button type="button" onClick={listenFirst} className={kidsButton("sky")}>
                      <Volume2 aria-hidden /> اسمعها
                    </button>
                    <button type="button" onClick={retry} className={kidsButton("gold")}>
                      <Mic aria-hidden /> مرة أخرى
                    </button>
                  </>
                )}
                <button type="button" onClick={next} className={kidsButton("emerald")}>
                  {index + 1 >= ayahs.length ? "النتيجة" : "الآية التالية"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex flex-col items-center gap-4">
              <motion.button
                type="button"
                onClick={toggleMic}
                whileTap={{ scale: 0.92 }}
                animate={speech.listening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={speech.listening ? { duration: 1.2, repeat: Infinity } : {}}
                className={cn(
                  "grid size-28 place-items-center rounded-full text-white",
                  speech.listening ? "bg-[#e84a67] shadow-[0_8px_0_#b92f49]" : "bg-[#12a15b] shadow-[0_8px_0_#0b7a44]",
                )}
                aria-label={speech.listening ? "إيقاف الاستماع" : "ابدأ التسميع"}
              >
                {speech.listening ? <MicOff className="size-12" aria-hidden /> : <Mic className="size-12" aria-hidden />}
              </motion.button>
              <p className="text-lg font-extrabold text-muted">
                {speech.listening ? "أنا أسمعك… اقرأ الآية" : "اضغط على الميكروفون واقرأ الآية"}
              </p>
              {speech.error === "not-allowed" && (
                <p className="text-base text-[#8a5a00]">
                  نحتاج إذنًا لاستخدام الميكروفون. اطلب من أبيك أو أمك السماح بذلك من إعدادات المتصفح.
                </p>
              )}
              {speech.error === "network" && (
                <p className="text-base text-[#8a5a00]">يحتاج التسميع إلى الإنترنت. تأكد من الاتصال وحاول مرة أخرى.</p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={listenFirst} className={kidsButton("white", "px-4 py-2 text-base")}>
                  <Volume2 aria-hidden /> اسمعها أولًا
                </button>
                <button type="button" onClick={skip} className={kidsButton("white", "px-4 py-2 text-base")}>
                  <SkipForward aria-hidden /> الآية التالية
                </button>
                {results.length >= MIN_AYAHS_TO_FINISH && (
                  <button type="button" onClick={() => finishSession(results)} className={kidsButton("white", "px-4 py-2 text-base")}>
                    يكفي اليوم
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Celebration
        open={finished}
        title={good / Math.max(results.length, 1) >= PASS_SHARE ? "ما شاء الله! صوتك جميل بالقرآن" : "أحسنت المحاولة يا بطل!"}
        message={`قرأت ${toArabicDigits(good)} من ${toArabicDigits(results.length)} آيات بشكل جميل`}
        stars={good === results.length ? 3 : good / Math.max(results.length, 1) >= PASS_SHARE ? 2 : 1}
      >
        <button type="button" onClick={restart} className={kidsButton("rose")}>
          سمّع مرة أخرى
        </button>
        <Link href={`/kids/journey/${surah.id}`} className={kidsButton("white")}>
          العودة للمحطة
        </Link>
      </Celebration>
    </div>
  );
}
