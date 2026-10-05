"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { toArabicDigits } from "@/lib/arabic";
import { RADIO_STATION, useAudio } from "@/features/audio/AudioProvider";

const BAR_COUNT = 28;

export function RadioStage() {
  const audio = useAudio();
  const ref = useRef<HTMLDivElement>(null);
  const isRadio = audio.track?.kind === "radio";
  const on = isRadio && audio.playing;
  const busy = isRadio && audio.loading;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.to("[data-orbit]", { rotate: 360, duration: 60, ease: "none", repeat: -1 });
        gsap.from("[data-radio-fade]", { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.1, ease: "power3.out" });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const VolumeIcon = audio.volume === 0 ? VolumeX : audio.volume < 50 ? Volume1 : Volume2;

  return (
    <div ref={ref} className="relative isolate overflow-hidden bg-emerald-night text-white">
      <div className="pattern-stars-light absolute inset-0 -z-10" aria-hidden />
      <div
        className="absolute left-1/2 top-1/2 -z-10 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald/40 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <p data-radio-fade className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-gold-soft">
          <span className="relative flex size-2.5">
            {on && <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose opacity-75" />}
            <span className={`relative inline-flex size-2.5 rounded-full ${on ? "bg-rose" : "bg-white/40"}`} />
          </span>
          {on ? "على الهواء الآن" : "بث مباشر على مدار الساعة"}
        </p>
        <h1 data-radio-fade className="mt-5 text-4xl font-bold sm:text-5xl">
          إذاعة القرآن الكريم
        </h1>
        <p data-radio-fade className="mt-3 text-white/70">
          {RADIO_STATION.name}
        </p>
        <Link
          href="/recordings"
          className="mt-5 rounded-full border border-gold/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-gold-soft transition-colors hover:bg-white/20"
        >
          استمع إلى تسجيلات الإذاعة
        </Link>

        <div data-radio-fade className="relative my-12 grid size-72 place-items-center sm:size-80">
          <svg data-orbit viewBox="0 0 200 200" className="absolute inset-0 size-full text-gold/40" aria-hidden>
            <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeDasharray="2 7" />
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={(100 + 96 * Math.cos((i * Math.PI) / 6)).toFixed(2)}
                cy={(100 + 96 * Math.sin((i * Math.PI) / 6)).toFixed(2)}
                r="2.4"
                fill="currentColor"
              />
            ))}
          </svg>
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-8 rounded-full border border-gold/40"
              animate={on ? { scale: [1, 1.45], opacity: [0.6, 0] } : { scale: 1, opacity: 0.25 }}
              transition={on ? { duration: 2.6, repeat: Infinity, delay: ring * 0.85, ease: "easeOut" } : { duration: 0.3 }}
              aria-hidden
            />
          ))}
          <button
            type="button"
            onClick={() => (on ? audio.pause() : audio.playRadio())}
            className="relative grid size-40 place-items-center rounded-full bg-linear-to-br from-gold-soft via-gold to-gold-deep text-emerald-night shadow-[0_30px_80px_-20px_rgb(205_162_62/70%)] transition-transform active:scale-95"
            aria-label={on ? "إيقاف الإذاعة" : "تشغيل الإذاعة"}
          >
            <svg viewBox="0 0 48 48" className="absolute size-32 text-white/20" aria-hidden>
              <path d="M24 2l5.6 13.5L44 10l-5.5 14L44 38l-14.4-5.5L24 46l-5.6-13.5L4 38l5.5-14L4 10l14.4 5.5z" fill="currentColor" />
            </svg>
            {busy ? (
              <Loader2 className="relative size-14 animate-spin" aria-hidden />
            ) : on ? (
              <Pause className="relative size-14 fill-current" aria-hidden />
            ) : (
              <Play className="relative ml-2 size-14 fill-current" aria-hidden />
            )}
          </button>
        </div>

        <div data-radio-fade className="flex h-16 w-full max-w-md items-end justify-center gap-1" aria-hidden>
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <span
              key={i}
              className={`w-1.5 origin-bottom rounded-full bg-linear-to-t from-gold-deep to-gold-soft ${on ? "animate-eq" : "scale-y-[0.12]"}`}
              style={{
                height: `${30 + ((i * 37) % 70)}%`,
                animationDelay: `${(i % 7) * 0.12}s`,
                animationDuration: `${0.9 + (i % 5) * 0.18}s`,
              }}
            />
          ))}
        </div>

        <label data-radio-fade className="mt-8 flex w-full max-w-sm items-center gap-3 rounded-full bg-white/10 px-5 py-3">
          <VolumeIcon className="size-5 shrink-0 text-gold-soft" aria-hidden />
          <span className="sr-only">مستوى الصوت</span>
          <input
            type="range"
            min={0}
            max={100}
            value={audio.volume}
            onChange={(event) => audio.setVolume(Number(event.target.value))}
            className="flex-1 accent-gold"
            style={{ direction: "ltr" }}
          />
          <output className="w-10 text-sm tabular-nums">{toArabicDigits(audio.volume)}٪</output>
        </label>

        <p
          role="status"
          className={`mt-4 min-h-5 text-sm ${isRadio && !audio.error && audio.radioOnBackup ? "text-gold-soft" : "text-rose"}`}
        >
          {!isRadio ? "" : audio.error || (audio.radioOnBackup ? "البث الرسمي متوقف مؤقتًا، ونشغّل لك من مصدر بديل حتى يعود." : "")}
        </p>
        <a
          data-radio-fade
          href={RADIO_STATION.providerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold-soft"
        >
          مصدر البث: {RADIO_STATION.providerName} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
