"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pause, Play, Repeat, Repeat1, Search, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import { useAudio, type AudioTrack, type RepeatMode } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { buildSurahAudioUrl, type Reciter, type Riwaya, type Surah } from "@/features/quran/api";
import { ReciterAvatar } from "./ReciterBrowser";

const RATES = [0.75, 1, 1.25, 1.5];
const REPEAT_ORDER: RepeatMode[] = ["off", "all", "one"];
const REPEAT_LABEL: Record<RepeatMode, string> = { off: "بدون تكرار", all: "تكرار الكل", one: "تكرار السورة" };

interface ReciterPlayerProps {
  reciter: Reciter;
  surahs: Surah[];
  riwayat: Riwaya[];
  href: string;
}

export function ReciterPlayer({ reciter, surahs, riwayat, href }: ReciterPlayerProps) {
  const audio = useAudio();
  const [moshafId, setMoshafId] = useState(reciter.moshaf[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const moshaf = reciter.moshaf.find((entry) => entry.id === moshafId) ?? reciter.moshaf[0];
  const surahName = useMemo(() => new Map(surahs.map((surah) => [surah.id, surah.name])), [surahs]);
  const riwayaName = (id: number) => riwayat.find((entry) => entry.id === id)?.name ?? "";

  const queue = useMemo<AudioTrack[]>(
    () =>
      (moshaf?.surahList ?? []).map((id) => ({
        id: `m${moshaf!.id}-s${id}`,
        kind: "surah" as const,
        title: `سورة ${surahName.get(id) ?? id}`,
        subtitle: reciter.name,
        src: buildSurahAudioUrl(moshaf!.server, id),
        href,
      })),
    [moshaf, surahName, reciter.name, href],
  );

  const visible = useMemo(() => {
    const needle = normalizeArabic(query);
    return queue.filter((track) => !needle || normalizeArabic(track.title).includes(needle));
  }, [queue, query]);

  const activeTrack = audio.track && queue.some((track) => track.id === audio.track?.id) ? audio.track : null;
  const progress = activeTrack && audio.duration > 0 ? audio.currentTime / audio.duration : 0;

  function playTrack(track: AudioTrack) {
    if (audio.isCurrent(track.id)) {
      audio.toggle();
      return;
    }
    audio.play(track, { queue });
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[22rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-night p-6 text-white shadow-lift">
          <div className="pattern-stars-light absolute inset-0 -z-10" aria-hidden />
          <motion.div
            className="absolute -top-24 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-gold/25 blur-3xl"
            animate={audio.playing && activeTrack ? { scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.5 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <ReciterAvatar name={reciter.name} className="size-28 text-5xl ring-4 ring-gold/40" />
              {activeTrack && audio.playing && (
                <EqualizerBars
                  active
                  bars={5}
                  className="absolute -bottom-2 left-1/2 h-6 -translate-x-1/2 rounded-full bg-emerald-night px-2 text-gold"
                />
              )}
            </div>
            <h2 className="mt-5 text-xl font-bold">{reciter.name}</h2>
            <p className="mt-1 text-sm text-gold-soft">{activeTrack ? activeTrack.title : "اختر سورة للاستماع"}</p>
          </div>

          <div className="mt-6">
            <input
              type="range"
              min={0}
              max={Math.max(1, audio.duration)}
              step={1}
              value={activeTrack ? audio.currentTime : 0}
              disabled={!activeTrack}
              onChange={(event) => audio.seek(Number(event.target.value))}
              aria-label="موضع التشغيل"
              className="w-full accent-gold"
              style={{ direction: "ltr" }}
            />
            <div className="mt-1 flex justify-between text-xs text-white/60" dir="ltr">
              <span>{formatDuration(activeTrack ? audio.currentTime : 0)}</span>
              <span>{formatDuration(activeTrack ? audio.duration : 0)}</span>
            </div>
            <div className="sr-only" aria-live="polite">
              {toArabicDigits(Math.round(progress * 100))}٪
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={audio.previous}
              disabled={!activeTrack}
              className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40"
              aria-label="السورة السابقة"
            >
              <SkipForward className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => (activeTrack ? audio.toggle() : queue[0] && playTrack(queue[0]))}
              className="grid size-16 place-items-center rounded-full bg-gold text-emerald-night shadow-gold transition-transform active:scale-95"
              aria-label={audio.playing && activeTrack ? "إيقاف مؤقت" : "تشغيل"}
            >
              {audio.loading && activeTrack ? (
                <Loader2 className="size-7 animate-spin" aria-hidden />
              ) : audio.playing && activeTrack ? (
                <Pause className="size-7 fill-current" aria-hidden />
              ) : (
                <Play className="size-7 fill-current" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={audio.next}
              disabled={!activeTrack}
              className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40"
              aria-label="السورة التالية"
            >
              <SkipBack className="size-5" aria-hidden />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => audio.setRepeat(REPEAT_ORDER[(REPEAT_ORDER.indexOf(audio.repeat) + 1) % REPEAT_ORDER.length]!)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-bold",
                audio.repeat === "off" ? "bg-white/10 text-white/70" : "bg-gold/20 text-gold-soft",
              )}
            >
              {audio.repeat === "one" ? <Repeat1 className="size-4" aria-hidden /> : <Repeat className="size-4" aria-hidden />}
              {REPEAT_LABEL[audio.repeat]}
            </button>
            <div className="flex rounded-full bg-white/10 p-1" role="group" aria-label="سرعة التشغيل">
              {RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={audio.rate === rate}
                  onClick={() => audio.setRate(rate)}
                  className={cn("rounded-full px-2 py-1 font-bold", audio.rate === rate ? "bg-gold text-emerald-night" : "text-white/70")}
                >
                  {toArabicDigits(rate)}×
                </button>
              ))}
            </div>
          </div>
          {audio.error && activeTrack && <p className="mt-3 text-center text-xs text-rose">{audio.error}</p>}
        </div>

        {reciter.moshaf.length > 1 && (
          <div className="mt-5 space-y-2" role="group" aria-label="المصاحف المتاحة">
            {reciter.moshaf.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === moshaf?.id}
                onClick={() => setMoshafId(entry.id)}
                className={cn(
                  "block w-full rounded-2xl border p-3 text-start text-sm transition-colors",
                  entry.id === moshaf?.id ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                )}
              >
                <span className="block font-bold text-emerald-deep">{entry.name}</span>
                <span className="text-xs text-muted">
                  {riwayaName(entry.rewayaId)} · {toArabicDigits(entry.surahList.length)} سورة
                </span>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section aria-label="السور">
        <label className="relative mb-4 block">
          <span className="sr-only">ابحث عن سورة</span>
          <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن سورة…"
            className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-12 outline-none focus:border-emerald/40"
          />
        </label>
        {queue.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted">لا توجد سور متاحة لهذا المصحف.</p>}
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((track) => {
            const current = audio.isCurrent(track.id);
            const surahId = Number(track.id.split("-s")[1]);
            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => playTrack(track)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-[border-color,background-color]",
                    current ? "border-emerald bg-emerald text-white shadow-soft" : "border-line bg-white hover:border-gold/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                      current ? "bg-white/15" : "bg-gold-mist text-gold-deep",
                    )}
                  >
                    {current && audio.playing ? <EqualizerBars active /> : toArabicDigits(surahId)}
                  </span>
                  <span className="flex-1 font-bold">{track.title}</span>
                  {current && audio.playing ? (
                    <Pause className="size-4 fill-current" aria-hidden />
                  ) : (
                    <Play className={cn("size-4", current ? "fill-current" : "text-emerald")} aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
