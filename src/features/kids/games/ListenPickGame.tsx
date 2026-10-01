"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Ear, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useAudio } from "@/features/audio/AudioProvider";
import { husaryAyahUrl } from "@/features/quran/ayahAudio";
import type { Surah } from "@/features/quran/api";
import type { Ayah } from "@/features/quran/textApi";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { useCompanion } from "../companion/CompanionProvider";
import { buildListenPickRounds, type ListenPickRound } from "./listenPickLogic";
import { ayahPreview, starsForSlips } from "./gameUtils";

export function ListenPickGame({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const audio = useAudio();
  const { recordGame } = useKidsProgress();
  const { react } = useCompanion();
  const [rounds, setRounds] = useState<ListenPickRound[]>([]);
  const [index, setIndex] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [slips, setSlips] = useState(0);
  const [won, setWon] = useState(false);
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

  const round = rounds[index];

  function playAyah(target: Ayah) {
    audio.play({
      id: `kids-pick-${target.number}`,
      kind: "ayah",
      title: `سورة ${surah.name}`,
      subtitle: "اسمع واختر",
      src: husaryAyahUrl(target.number),
    });
  }

  function start() {
    const next = buildListenPickRounds(ayahs);
    if (next.length === 0) return;
    sfx.tap();
    setRounds(next);
    setIndex(0);
    setWrongPicks([]);
    setSolved(false);
    setSlips(0);
    setWon(false);
    playAyah(next[0]!.target);
  }

  function pick(choice: Ayah) {
    if (!round || solved) return;
    if (choice.number === round.target.number) {
      sfx.correct();
      react("correct");
      setSolved(true);
      setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex >= rounds.length) {
          recordGame({
            game: "listen_pick",
            surah: surah.id,
            score: rounds.length,
            total: rounds.length,
            stars: starsForSlips(slips, rounds.length),
          });
          sfx.win();
          setWon(true);
          return;
        }
        setIndex(nextIndex);
        setWrongPicks([]);
        setSolved(false);
        playAyah(rounds[nextIndex]!.target);
      }, 900);
    } else {
      sfx.flip();
      react("almost");
      setSlips((value) => value + 1);
      setWrongPicks((current) => [...current, choice.number]);
    }
  }

  if (!round) {
    return (
      <div className={`${kidsPanel} mx-auto max-w-2xl text-center`}>
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#1f9be0] text-white shadow-[0_7px_0_#157ab3]">
          <Ear className="size-10" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">اسمع واختر: سورة {surah.name}</h1>
        <p className="mt-2 text-lg text-muted">اسمع الآية جيدًا، ثم اضغط على الآية التي سمعتها.</p>
        {ayahs.length >= 3 ? (
          <button type="button" onClick={start} className={kidsButton("sky", "mt-6 px-10")}>
            ابدأ اللعب
          </button>
        ) : (
          <p className="mt-6 text-muted">هذه السورة قصيرة جدًا لهذه اللعبة، جرّب سورة أخرى.</p>
        )}
      </div>
    );
  }

  const playing = audio.isCurrent(`kids-pick-${round.target.number}`) && audio.playing;
  const stars = starsForSlips(slips, rounds.length);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lift ring-4 ring-white/60">
        <h1 className="text-xl font-extrabold text-emerald-deep">اسمع واختر: {surah.name}</h1>
        <div className="flex gap-1.5" aria-label={`السؤال ${index + 1} من ${rounds.length}`}>
          {rounds.map((_, dot) => (
            <span
              key={dot}
              className={cn("size-3.5 rounded-full", dot < index ? "bg-[#12a15b]" : dot === index ? "bg-[#f5b92e]" : "bg-[#dfe6da]")}
            />
          ))}
        </div>
      </div>

      <section className={cn(kidsPanel, "text-center")}>
        <motion.button
          type="button"
          onClick={() => (audio.isCurrent(`kids-pick-${round.target.number}`) ? audio.toggle() : playAyah(round.target))}
          whileTap={{ scale: 0.92 }}
          animate={playing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={playing ? { duration: 1, repeat: Infinity } : {}}
          className="mx-auto grid size-28 place-items-center rounded-full bg-[#1f9be0] text-white shadow-[0_8px_0_#157ab3]"
          aria-label="اسمع الآية"
        >
          <Volume2 className="size-14" aria-hidden />
        </motion.button>
        <p className="mt-4 text-lg font-extrabold text-muted">{playing ? "استمع جيدًا…" : "اضغط لتسمع الآية مرة أخرى"}</p>

        <ul className="mt-6 space-y-3">
          {round.choices.map((choice) => {
            const wrong = wrongPicks.includes(choice.number);
            const right = solved && choice.number === round.target.number;
            return (
              <li key={choice.number}>
                <motion.button
                  type="button"
                  onClick={() => pick(choice)}
                  disabled={wrong || solved}
                  animate={wrong ? { x: [0, -8, 8, -4, 0] } : right ? { scale: [1, 1.04, 1] } : {}}
                  className={cn(
                    "quran-text w-full rounded-3xl px-5 py-4 text-2xl leading-loose ring-4 transition-colors sm:text-3xl",
                    right
                      ? "bg-[#dff7e8] ring-[#12a15b]"
                      : wrong
                        ? "bg-[#f4f4f1] text-muted opacity-60 ring-transparent"
                        : "bg-[#fffaf0] ring-[#f5e2ad] hover:bg-[#fff3d6]",
                  )}
                >
                  {ayahPreview(choice.text, 10)}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </section>

      <Celebration
        open={won}
        title="ما شاء الله! أذنك ذهبية 🎧"
        message={`عرفت ${toArabicDigits(rounds.length)} آيات من سورة ${surah.name}`}
        stars={stars}
      >
        <button type="button" onClick={start} className={kidsButton("sky")}>
          العب مرة أخرى
        </button>
        <Link href={`/kids/journey/${surah.id}`} className={kidsButton("white")}>
          العودة للمحطة
        </Link>
      </Celebration>
    </div>
  );
}
