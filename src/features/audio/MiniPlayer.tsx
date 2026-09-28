"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play, Radio, SkipBack, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAudio } from "./AudioProvider";
import { EqualizerBars } from "./EqualizerBars";

const HIDDEN_ON = ["/radio", "/kids/learn/"];

export function MiniPlayer() {
  const pathname = usePathname();
  const audio = useAudio();
  const { track } = audio;
  const hidden =
    !track ||
    HIDDEN_ON.some((prefix) => (prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix)) ||
    (track.href !== undefined && pathname === track.href);
  const progress = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;

  return (
    <AnimatePresence>
      {!hidden && track && (
        <motion.aside
          aria-label="المشغّل"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl overflow-hidden rounded-3xl bg-emerald-night text-white shadow-lift sm:bottom-5"
        >
          {track.kind !== "radio" && (
            <div className="h-1 bg-white/10">
              <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex items-center gap-3 p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold">
              {track.kind === "radio" ? <Radio className="size-5" aria-hidden /> : <EqualizerBars active={audio.playing} />}
            </span>
            <div className="min-w-0 flex-1">
              {track.href ? (
                <Link href={track.href as Route} className="block truncate font-bold hover:text-gold-soft">
                  {track.title}
                </Link>
              ) : (
                <p className="truncate font-bold">{track.title}</p>
              )}
              <p className="truncate text-xs text-white/60">{audio.error || track.subtitle}</p>
            </div>
            {audio.queue.length > 1 && (
              <button
                type="button"
                onClick={audio.previous}
                className="hidden size-10 place-items-center rounded-full hover:bg-white/10 sm:grid"
                aria-label="السابق"
              >
                <SkipForward className="size-5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={audio.toggle}
              aria-label={audio.playing ? "إيقاف مؤقت" : "تشغيل"}
              className={cn("grid size-12 place-items-center rounded-full bg-gold text-emerald-night transition-transform active:scale-95")}
            >
              {audio.loading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : audio.playing ? (
                <Pause className="size-5 fill-current" aria-hidden />
              ) : (
                <Play className="size-5 fill-current" aria-hidden />
              )}
            </button>
            {audio.queue.length > 1 && (
              <button
                type="button"
                onClick={audio.next}
                className="hidden size-10 place-items-center rounded-full hover:bg-white/10 sm:grid"
                aria-label="التالي"
              >
                <SkipBack className="size-5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={audio.stop}
              className="grid size-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="إغلاق المشغّل"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
