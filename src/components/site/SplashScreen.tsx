"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";
import { SPLASH_SEEN_KEY } from "./splash";
/** Long enough for the mark's entrance to finish, short enough not to feel like a wait. */
const MIN_VISIBLE_MS = 1300;
/** Never hold the page back on a slow font load. */
const MAX_VISIBLE_MS = 3000;
const FADE_MS = 550;

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Brand splash shown once per session. Server-rendered, so it covers the page before JS loads. */
export function SplashScreen() {
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    let cancelled = false;
    const skipped = document.documentElement.dataset.splash === "off";

    const ready = skipped
      ? Promise.resolve()
      : Promise.race([Promise.all([document.fonts.ready, delay(Math.max(0, MIN_VISIBLE_MS - performance.now()))]), delay(MAX_VISIBLE_MS)]);

    ready
      .then(() => {
        if (cancelled) return;
        try {
          sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
        } catch {
          // Private mode or blocked storage: the splash simply shows again next load.
        }
        if (skipped) return setPhase("gone");
        setPhase("leaving");
        return delay(FADE_MS).then(() => !cancelled && setPhase("gone"));
      })
      .catch(() => !cancelled && setPhase("gone"));

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className={cn(
        "splash fixed inset-0 z-200 grid place-items-center overflow-hidden bg-emerald-night text-white transition-[opacity,transform] duration-550 ease-out-soft",
        phase === "leaving" && "pointer-events-none scale-[1.03] opacity-0",
      )}
    >
      <div className="pattern-stars-light absolute inset-0" />
      <div className="absolute left-1/2 top-1/2 size-[min(36rem,140vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(205_162_62/22%),transparent_65%)]" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative grid size-28 place-items-center animate-splash-rise sm:size-32">
          <span className="absolute inset-0 rounded-full border border-dashed border-gold/40 animate-spin-slow" />
          <span className="grid size-20 place-items-center rounded-[1.75rem] bg-ivory shadow-gold sm:size-24">
            <BrandMark priority className="h-14 animate-splash-rise [animation-delay:60ms] sm:h-16" />
          </span>
        </div>

        <p className="mt-7 font-display text-4xl font-bold animate-splash-rise [animation-delay:120ms] sm:text-5xl">المنارة</p>
        <p className="mt-2 text-sm font-semibold tracking-wide text-gold-soft animate-splash-rise [animation-delay:220ms] sm:text-base">
          قرآن · علم · ذكر
        </p>

        <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10 animate-splash-rise [animation-delay:320ms]">
          <span className="block h-full w-1/2 rounded-full bg-linear-to-l from-transparent via-gold to-transparent animate-splash-bar" />
        </div>
      </div>

      <p className="quran-text absolute inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] px-6 text-center text-lg text-white/65 animate-splash-rise [animation-delay:420ms] sm:text-xl">
        ﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾
      </p>
    </div>
  );
}
