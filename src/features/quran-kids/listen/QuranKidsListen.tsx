"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Pause, Play, Repeat, SkipForward } from "lucide-react";
import { Amiri_Quran } from "next/font/google";
import type { Ayah, Surah } from "@/features/quran";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { buildAyahAudioUrl } from "./kidsAudioApi";
import { ReciteRecorder } from "./ReciteRecorder";
import "../quran-kids.css";

const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400", display: "swap" });

export function QuranKidsListen({ surah, ayahs }: { surah: Surah; ayahs: Ayah[] }) {
  const { recordListenCompletion } = useKidsProgress();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [error, setError] = useState("");
  const [completedOnce, setCompletedOnce] = useState(false);

  const currentAyah = ayahs[currentIndex];
  const audioUrl = useMemo(() => (currentAyah ? buildAyahAudioUrl(currentAyah.number) : null), [currentAyah]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    setError("");
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [audioUrl]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function playAyahAt(index: number) {
    if (index < 0 || index >= ayahs.length) return;
    setCurrentIndex(index);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function handleEnded() {
    setPlaying(false);
    const isLast = currentIndex === ayahs.length - 1;
    if (isLast && !completedOnce) {
      setCompletedOnce(true);
      recordListenCompletion(surah.id);
    }
    if (autoAdvance && !isLast) playAyahAt(currentIndex + 1);
  }

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/kids/listen" className="quran-back"><ArrowRight aria-hidden /> اختيار سورة أخرى</Link>

      <section className="quran-reciter-header">
        <span className="quran-reciter-header__avatar" aria-hidden><Play size={26} /></span>
        <div>
          <span className="landing-kicker">استمع وردد</span>
          <h1>{surah.name}</h1>
          <div className="quran-reciter-header__meta">
            <span className="quran-tag">{currentIndex + 1}/{ayahs.length} آية</span>
          </div>
        </div>
      </section>

      <div className="quran-kids-listen-controls">
        <label className="quran-type-filter">
          <button type="button" aria-pressed={autoAdvance} onClick={() => setAutoAdvance((value) => !value)}>
            {autoAdvance ? "الانتقال التلقائي: مفعّل" : "الانتقال التلقائي: متوقف"}
          </button>
        </label>
      </div>

      <article className={`quran-mushaf ${amiriQuran.className}`} lang="ar" dir="rtl">
        {ayahs.map((ayah, index) => (
          <div
            key={ayah.number}
            className={`quran-kids-listen-ayah${index === currentIndex ? " quran-kids-listen-ayah--active" : ""}`}
            onClick={() => playAyahAt(index)}
          >
            <span>{ayah.text} <span className="quran-ayah-number" aria-hidden>﴿{ayah.numberInSurah}﴾</span></span>
            {index === currentIndex && (
              <span className="quran-kids-listen-ayah__controls">
                <button type="button" onClick={(event) => { event.stopPropagation(); togglePlayback(); }}>
                  {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
                  }}
                >
                  <Repeat size={14} /> أعد الآية
                </button>
                {index < ayahs.length - 1 && (
                  <button type="button" onClick={(event) => { event.stopPropagation(); playAyahAt(index + 1); }}>
                    <SkipForward size={14} /> الآية التالية
                  </button>
                )}
              </span>
            )}
          </div>
        ))}
      </article>

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="none"
        onEnded={handleEnded}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError("تعذر تشغيل هذه الآية الآن. حاول مرة أخرى أو انتقل للآية التالية."); }}
      />
      <p className="quran-empty" role="status" aria-live="polite">{error}</p>
      {completedOnce && <p className="quran-empty">أحسنت! أكملت هذه السورة 🎉</p>}

      {currentAyah && <ReciteRecorder key={`${surah.id}-${currentAyah.numberInSurah}`} />}
    </main>
  );
}
