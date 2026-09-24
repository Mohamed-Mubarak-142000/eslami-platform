"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Headphones, Pause, Play, Search, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import { buildSurahAudioUrl, type Moshaf, type Reciter, type Riwaya, type Surah } from "./api";
import "./quran.css";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "٠٠:٠٠";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

type MeccanFilter = "all" | "meccan" | "medinan";

export function QuranReciterDetail({
  reciter,
  surahs,
  riwayat,
  backHref = "/quran",
  backLabel = "كل القراء",
}: {
  reciter: Reciter;
  surahs: Surah[];
  riwayat: Riwaya[];
  backHref?: string;
  backLabel?: string;
}) {
  const reveal = useSocialMotionPreset("reveal");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedMoshafId, setSelectedMoshafId] = useState<number | null>(reciter.moshaf[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [meccanFilter, setMeccanFilter] = useState<MeccanFilter>("all");
  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const surahById = useMemo(() => new Map(surahs.map((surah) => [surah.id, surah])), [surahs]);
  const riwayaNameById = useMemo(() => new Map(riwayat.map((item) => [item.id, item.name])), [riwayat]);

  const selectedMoshaf: Moshaf | null = useMemo(
    () => reciter.moshaf.find((moshaf) => moshaf.id === selectedMoshafId) ?? reciter.moshaf[0] ?? null,
    [reciter, selectedMoshafId],
  );

  const surahEntries = useMemo(() => {
    if (!selectedMoshaf) return [];
    const query = search.trim();
    return selectedMoshaf.surahList
      .map((id) => surahById.get(id) ?? { id, name: `سورة ${id}`, meccan: true })
      .filter((surah) => {
        const matchesSearch = !query || surah.name.includes(query);
        const matchesType = meccanFilter === "all" || (meccanFilter === "meccan" ? surah.meccan : !surah.meccan);
        return matchesSearch && matchesType;
      });
  }, [selectedMoshaf, surahById, search, meccanFilter]);

  const currentAudioUrl = useMemo(() => {
    if (!selectedMoshaf || currentSurahId === null) return null;
    return buildSurahAudioUrl(selectedMoshaf.server, currentSurahId);
  }, [selectedMoshaf, currentSurahId]);

  function playSurah(id: number) {
    setError("");
    setCurrentSurahId(id);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;
    setError("");
    setLoading(true);
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        setError("تعذر تشغيل هذه التلاوة الآن. تحقق من اتصالك ثم حاول مرة أخرى.");
      })
      .finally(() => setLoading(false));
  }, [currentAudioUrl]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;
    setError("");
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("تعذر تشغيل هذه التلاوة الآن. تحقق من اتصالك ثم حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  function stepSurah(direction: 1 | -1) {
    if (!selectedMoshaf || currentSurahId === null) return;
    const list = selectedMoshaf.surahList;
    const index = list.indexOf(currentSurahId);
    if (index === -1) return;
    const nextIndex = (index + direction + list.length) % list.length;
    playSurah(list[nextIndex]!);
  }

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  }

  function updateVolume(value: number) {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  }

  const currentSurahName = currentSurahId !== null ? (surahById.get(currentSurahId)?.name ?? `سورة ${currentSurahId}`) : "";
  const riwayaNames = Array.from(new Set(reciter.moshaf.map((moshaf) => riwayaNameById.get(moshaf.rewayaId) ?? moshaf.name)));

  return (
    <main id="quran-main" className="quran-page">
      <Link href={backHref as Route} className="quran-back"><ArrowRight aria-hidden /> {backLabel}</Link>

      <motion.section className="quran-reciter-header" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="quran-reciter-header__avatar" aria-hidden>{reciter.name.charAt(0)}</span>
        <div>
          <span className="landing-kicker"><Headphones size={17} aria-hidden /> تلاوات القارئ</span>
          <h1>{reciter.name}</h1>
          <div className="quran-reciter-header__meta">
            <span>{selectedMoshaf?.surahList.length ?? 0} سورة متاحة</span>
            {riwayaNames.map((name) => <span key={name} className="quran-tag">{name}</span>)}
          </div>
        </div>
      </motion.section>

      {reciter.moshaf.length > 1 && (
        <div className="quran-moshaf-switch" role="tablist" aria-label="اختيار الرواية">
          {reciter.moshaf.map((moshaf) => (
            <button
              key={moshaf.id}
              type="button"
              role="tab"
              aria-selected={moshaf.id === selectedMoshaf?.id}
              onClick={() => setSelectedMoshafId(moshaf.id)}
            >
              {moshaf.name}
            </button>
          ))}
        </div>
      )}

      <div className="quran-filters">
        <label className="quran-search">
          <Search aria-hidden />
          <span className="sr-only">ابحث عن سورة</span>
          <input
            type="search"
            placeholder="ابحث عن سورة..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </label>
        <div className="quran-type-filter" role="tablist" aria-label="نوع السورة">
          <button type="button" role="tab" aria-selected={meccanFilter === "all"} onClick={() => setMeccanFilter("all")}>الكل</button>
          <button type="button" role="tab" aria-selected={meccanFilter === "meccan"} onClick={() => setMeccanFilter("meccan")}>مكية</button>
          <button type="button" role="tab" aria-selected={meccanFilter === "medinan"} onClick={() => setMeccanFilter("medinan")}>مدنية</button>
        </div>
      </div>

      {surahEntries.length === 0 && <p className="quran-empty">لا توجد سور مطابقة لبحثك أو الفلتر المختار.</p>}
      <div className="quran-surah-grid">
        {surahEntries.map(({ id, name }) => (
          <button
            key={id}
            type="button"
            className="quran-surah"
            data-active={id === currentSurahId || undefined}
            onClick={() => playSurah(id)}
            aria-pressed={id === currentSurahId}
          >
            <span className="quran-surah__number">{id}</span>
            <span className="quran-surah__name">{name}</span>
            {id === currentSurahId && playing && <Play size={14} fill="currentColor" aria-hidden />}
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        src={currentAudioUrl ?? undefined}
        preload="none"
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => stepSurah(1)}
        onError={() => {
          setPlaying(false);
          setLoading(false);
          setError("تعذر تحميل هذه التلاوة. حاول اختيار سورة أخرى أو المحاولة لاحقًا.");
        }}
      />

      {currentAudioUrl && (
        <div className="quran-player" role="region" aria-label="مشغل القرآن الكريم">
          <div className="quran-player__inner">
            <div className="quran-player__art" aria-hidden><Headphones /></div>
            <div className="quran-player__meta">
              <strong>{currentSurahName}</strong>
              <span>{reciter.name}</span>
            </div>
            <div className="quran-player__controls">
              <button type="button" onClick={() => stepSurah(-1)} aria-label="السورة السابقة"><SkipBack aria-hidden /></button>
              <button type="button" className="quran-player__play" onClick={togglePlayback} disabled={loading}
                aria-label={playing ? "إيقاف التلاوة مؤقتًا" : "تشغيل التلاوة"}>
                {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
              </button>
              <button type="button" onClick={() => stepSurah(1)} aria-label="السورة التالية"><SkipForward aria-hidden /></button>
            </div>
            <label className="quran-player__progress">
              <output>{formatTime(progress)}</output>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={Math.min(progress, duration || 0)}
                onChange={(event) => seekTo(Number(event.currentTarget.value))}
                aria-label="موضع التشغيل"
              />
              <output>{formatTime(duration)}</output>
            </label>
            <label className="quran-player__volume">
              <Volume2 aria-hidden />
              <span className="sr-only">مستوى الصوت</span>
              <input type="range" min={0} max={100} value={volume} onChange={(event) => updateVolume(Number(event.currentTarget.value))} />
            </label>
          </div>
          <p className="quran-player__status" role="status" aria-live="polite">{error}</p>
        </div>
      )}
    </main>
  );
}
