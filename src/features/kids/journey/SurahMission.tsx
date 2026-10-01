"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Lock, Pause, Play, Star } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { useAudio } from "@/features/audio/AudioProvider";
import type { Surah } from "@/features/quran/api";
import type { TeachingTrack } from "../kidsData";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { missionProgress, regionOf, stationStars, type MissionProgress } from "../progress/journey";
import { isSurahUnlocked, nextSurahId } from "../progress/levels";
import { getSurahAyahCount } from "../progress/surahAyahCounts";
import { KIDS_SURAH_IDS } from "../kidsSurahs";
import { Companion } from "../companion/Companion";
import { useCompanion } from "../companion/CompanionProvider";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";

interface StepCardProps {
  done: boolean;
  emoji: string;
  title: string;
  hint: string;
  color: string;
  shadow: string;
  index: number;
  children: React.ReactNode;
}

function StepCard({ done, emoji, title, hint, color, shadow, index, children }: StepCardProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.08, type: "spring", stiffness: 240, damping: 20 }}
      className={`flex flex-col gap-4 rounded-[2rem] p-5 shadow-lift ring-4 sm:flex-row sm:items-center ${
        done ? "bg-[#effaf2] ring-[#bfe8cd]" : "bg-white/95 ring-white/60"
      }`}
    >
      <span
        className="relative grid size-18 shrink-0 place-items-center self-center rounded-3xl text-4xl"
        style={{ background: color, boxShadow: `0 6px 0 ${shadow}` }}
        aria-hidden
      >
        {emoji}
        {done && (
          <span className="absolute -top-2 -inset-e-2 grid size-8 place-items-center rounded-full bg-[#12a15b] text-white ring-4 ring-white">
            <Check className="size-5" />
          </span>
        )}
      </span>
      <div className="flex-1 text-center sm:text-start">
        <h3 className="text-2xl font-extrabold text-emerald-deep">
          {title} {done && <span className="sr-only">(تم)</span>}
        </h3>
        <p className="mt-0.5 text-base text-muted">{hint}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </motion.li>
  );
}

export function SurahMission({ surah, teaching }: { surah: Surah; teaching: TeachingTrack | null }) {
  const { state, status, recordListenCompletion } = useKidsProgress();
  const audio = useAudio();
  const { react } = useCompanion();
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  });
  useEffect(
    () => () => {
      if (audioRef.current.track?.id.startsWith("kids-")) audioRef.current.stop();
    },
    [],
  );

  const region = regionOf(surah.id);
  const station = KIDS_SURAH_IDS.indexOf(surah.id) + 1;
  const progress: MissionProgress = missionProgress(state, surah.id);
  const stars = stationStars(state, surah.id);
  const ayahCount = getSurahAyahCount(surah.id);
  const memorizedCount = state.memorizedAyahsBySurah[surah.id]?.length ?? 0;
  const next = nextSurahId(surah.id);
  const unlocked = isSurahUnlocked(state, surah.id);
  const shortSurah = ayahCount <= 8;

  const listenId = `kids-mission-${surah.id}`;
  const listening = audio.isCurrent(listenId) && audio.playing;

  function listen() {
    if (!teaching) return;
    if (audio.isCurrent(listenId)) {
      audio.toggle();
      return;
    }
    sfx.tap();
    audio.play(
      {
        id: listenId,
        kind: "surah",
        title: `سورة ${surah.name} مع الأطفال`,
        subtitle: teaching.reciterName,
        src: teaching.src,
        href: `/kids/journey/${surah.id}`,
      },
      {
        onEnded: () => {
          recordListenCompletion(surah.id);
          sfx.win();
          react("correct");
        },
      },
    );
  }

  if (status === "ready" && !unlocked) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-xl text-center`}>
        <Lock className="mx-auto size-14 text-[#a9b3ae]" aria-hidden />
        <h1 className="mt-3 text-3xl font-extrabold text-emerald-deep">سورة {surah.name} مغلقة الآن</h1>
        <p className="mt-2 text-lg text-muted">اجتز اختبار المحطة التي قبلها، وستُفتح لك هذه السورة 🔓</p>
        <Link href="/kids" className={kidsButton("emerald", "mt-6")}>
          <ArrowRight aria-hidden /> العودة للخريطة
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-6 text-center shadow-lift ring-4 ring-white/70 sm:p-8"
        style={{ background: `${region.tint}f5` }}
      >
        <p
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-base font-extrabold"
          style={{ color: region.shadow }}
        >
          {region.emoji} {region.name} · المحطة {toArabicDigits(station)}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-emerald-deep sm:text-5xl">سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">{toArabicDigits(ayahCount)} آيات · أكمل المهام واجمع النجوم الخمس!</p>
        <div className="mt-4 flex justify-center gap-1.5" aria-label={`${stars} من ٥ نجوم`}>
          {Array.from({ length: 5 }, (_, index) => (
            <motion.span
              key={index}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + index * 0.08, type: "spring", stiffness: 300, damping: 14 }}
            >
              <Star className={`size-10 ${index < stars ? "fill-[#f5c542] text-[#e0a800]" : "fill-white text-[#d9dccf]"}`} aria-hidden />
            </motion.span>
          ))}
        </div>
        {state.companion && (
          <Companion
            animal={state.companion.animal}
            equipped={state.companion.equipped}
            mood={stars === 5 ? "cheer" : "happy"}
            className="pointer-events-none absolute -bottom-4 left-2 hidden size-32 sm:block"
          />
        )}
      </motion.header>

      <ol className="mt-6 space-y-4">
        <StepCard
          index={0}
          done={progress.listen}
          emoji="🎧"
          title="اسمع السورة"
          hint="استمع للشيخ والأطفال وردّد معهم حتى النهاية"
          color="#1f9be0"
          shadow="#157ab3"
        >
          {teaching ? (
            <button type="button" onClick={listen} className={kidsButton("sky")}>
              {listening ? <Pause aria-hidden /> : <Play className="fill-current" aria-hidden />} {listening ? "إيقاف" : "استمع"}
            </button>
          ) : (
            <span className="text-muted">التسجيل غير متاح الآن</span>
          )}
        </StepCard>

        <StepCard
          index={1}
          done={progress.learn}
          emoji="📖"
          title="احفظ آياتها"
          hint={`حفظت ${toArabicDigits(memorizedCount)} من ${toArabicDigits(ayahCount)} آيات`}
          color="#12a15b"
          shadow="#0b7a44"
        >
          <Link href={`/kids/learn/${surah.id}` as Route} className={kidsButton("emerald")}>
            ابدأ الحفظ
          </Link>
        </StepCard>

        <StepCard
          index={2}
          done={progress.play}
          emoji="🎮"
          title="العب بالسورة"
          hint="أي لعبة على هذه السورة تكمل المهمة"
          color="#f5b92e"
          shadow="#c98f10"
        >
          {shortSurah && (
            <Link href={`/kids/games/ayah-order/${surah.id}` as Route} className={kidsButton("gold")}>
              رتّب الآيات
            </Link>
          )}
          <Link href={`/kids/games/listen-pick/${surah.id}` as Route} className={kidsButton(shortSurah ? "white" : "gold")}>
            اسمع واختر
          </Link>
          <Link href={`/kids/games/arrange/${surah.id}` as Route} className={kidsButton("white")}>
            رتّب الكلمات
          </Link>
        </StepCard>

        <StepCard
          index={3}
          done={progress.recite}
          emoji="🎤"
          title="سمّعني"
          hint="اقرأ بصوتك ورفيقك يسمعك"
          color="#e84a67"
          shadow="#b92f49"
        >
          <Link href={`/kids/recite/${surah.id}` as Route} className={kidsButton("rose")}>
            سمّع الآن
          </Link>
        </StepCard>

        <StepCard
          index={4}
          done={progress.quiz}
          emoji="🧠"
          title="اختبار المحطة"
          hint={progress.quiz ? "اجتزت الاختبار وفتحت المحطة التالية!" : "اجتز الاختبار لتفتح المحطة التالية 🔓"}
          color="#7a5af5"
          shadow="#5a3ed1"
        >
          <Link href={`/kids/quiz/${surah.id}` as Route} className={kidsButton("violet")}>
            {progress.quiz ? "أعد الاختبار" : "ابدأ الاختبار"}
          </Link>
        </StepCard>
      </ol>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/kids" className={kidsButton("white")}>
          <ArrowRight aria-hidden /> الخريطة
        </Link>
        {progress.quiz && next !== null && (
          <Link href={`/kids/journey/${next}` as Route} className={kidsButton("emerald")}>
            المحطة التالية 🚀
          </Link>
        )}
      </div>
    </div>
  );
}
