"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink, Lightbulb, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { SeerahMap, stageFrame } from "./SeerahMap";
import { SeerahScene } from "./SeerahScenes";
import { CHAPTERS, HADITHS, VERSES, WHOLE_MAP, routesAt, type HadithKey, type SeerahEvent, type VerseKey } from "./seerahContent";
import { updateSeerah } from "./seerahStore";

function VerseCard({ verseKey }: { verseKey: VerseKey }) {
  const verse = VERSES[verseKey];
  return (
    <figure className="rounded-3xl bg-emerald-deep p-5 text-white">
      <figcaption className="text-sm text-white/75">
        سورة {verse.surahName}، الآية {toArabicDigits(verse.ayah)}
      </figcaption>
      <p className="quran-text mt-3 text-[1.45em] leading-[2.2]">
        {verse.partial && "… "}﴿{verse.text}﴾
      </p>
    </figure>
  );
}

function HadithCard({ hadithKey }: { hadithKey: HadithKey }) {
  const hadith = HADITHS[hadithKey];
  return (
    <details className="group rounded-3xl border border-line bg-ivory p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-emerald-deep [&::-webkit-details-marker]:hidden">
        <ScrollText className="size-5 text-gold-deep" aria-hidden />
        الدليل من السنة
        <span className="ms-auto rounded-full bg-emerald-mist px-2.5 py-0.5 text-xs text-emerald-deep">{hadith.grade}</span>
      </summary>
      <p className="mt-3 leading-8 text-ink">{hadith.text}</p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">{hadith.attribution}</span>
        <a
          href={hadith.url}
          target="_blank"
          rel="noreferrer"
          className="ms-auto inline-flex items-center gap-1 text-muted underline underline-offset-4 hover:text-emerald"
        >
          الشرح <ExternalLink className="size-3" aria-hidden />
        </a>
      </p>
    </details>
  );
}

/** What the stage shows at a beat: its scene, or the map framed where the last map beat looked. */
function useStage(event: SeerahEvent, beat: number) {
  const current = event.beats[beat]!.stage;
  const lastMap = event.beats
    .slice(0, beat + 1)
    .map((entry) => entry.stage)
    .reverse()
    .find((stage) => stage.kind === "map");
  return {
    scene: current.kind === "scene" ? current : null,
    frame: lastMap?.kind === "map" ? stageFrame(lastMap) : WHOLE_MAP,
    named: lastMap?.kind === "map" ? [...new Set([...lastMap.focus, ...(lastMap.glow ?? [])])] : [],
    glow: current.kind === "map" ? (current.glow ?? []) : [],
    routes: routesAt(event, beat),
    approximate: current.kind === "map" && Boolean(current.route),
  };
}

/**
 * A chapter told as scrollytelling: the stage stays in view while the beats scroll past it, and the
 * beat in the middle of the screen sets what the stage shows.
 */
export function SeerahChapter({ event }: { event: SeerahEvent }) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const beatRefs = useRef<(HTMLElement | null)[]>([]);
  const stage = useStage(event, beat);
  const next = CHAPTERS[CHAPTERS.findIndex((chapter) => chapter.id === event.id) + 1];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setBeat(Number((visible.target as HTMLElement).dataset.beat));
      },
      // Phones keep the stage over the top of the screen, so the beat being read sits lower down.
      { rootMargin: window.matchMedia("(min-width: 64rem)").matches ? "-45% 0px -45% 0px" : "-68% 0px -28% 0px" },
    );
    beatRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    updateSeerah((current) => ({
      last: { event: event.id, beat },
      read: beat === event.beats.length - 1 && !current.read.includes(event.id) ? [...current.read, event.id] : current.read,
    }));
  }, [beat, event]);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="sticky top-16 z-10 -mx-4 h-[42vh] overflow-hidden border-b border-line bg-emerald-mist lg:top-24 lg:mx-0 lg:h-[calc(100vh-8rem)] lg:rounded-[2rem] lg:border">
        <SeerahMap frame={stage.frame} routes={stage.routes} named={stage.named} glow={stage.glow} />
        <AnimatePresence>
          {stage.scene && (
            <motion.div
              key={beat}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.8 }}
            >
              <SeerahScene sky={stage.scene.sky} land={stage.scene.land} items={stage.scene.items} />
            </motion.div>
          )}
        </AnimatePresence>
        {stage.approximate && (
          <span className="absolute bottom-3 start-3 rounded-full bg-white/85 px-3 py-1 text-xs text-muted backdrop-blur">
            المسار تقريبي
          </span>
        )}
        <div className="absolute inset-x-0 top-0 flex gap-1 p-3" aria-hidden>
          {event.beats.map((_, index) => (
            <span
              key={index}
              className={cn("h-1 flex-1 rounded-full transition-colors duration-500", index <= beat ? "bg-gold" : "bg-white/60")}
            />
          ))}
        </div>
      </div>

      <div className="pb-[30vh] pt-8">
        {event.beats.map((entry, index) => (
          <section
            key={index}
            ref={(element) => {
              beatRefs.current[index] = element;
            }}
            data-beat={index}
            className={cn(
              "flex min-h-[70vh] flex-col justify-center gap-4 transition-opacity duration-500",
              index === beat ? "opacity-100" : "opacity-35",
            )}
          >
            <span className="text-sm font-bold text-gold-deep">
              {toArabicDigits(index + 1)} / {toArabicDigits(event.beats.length)}
            </span>
            <p className="font-display text-xl leading-[2.1] text-ink md:text-2xl md:leading-[2.1]">{entry.text}</p>
            {entry.verse && <VerseCard verseKey={entry.verse} />}
            {entry.hadith && <HadithCard hadithKey={entry.hadith} />}
          </section>
        ))}

        {event.lesson && (
          <aside className="flex gap-3 rounded-3xl border border-gold/40 bg-gold-mist p-5">
            <Lightbulb className="size-6 shrink-0 text-gold-deep" aria-hidden />
            <div>
              <h2 className="font-bold text-emerald-deep">وقفة</h2>
              <p className="mt-1 leading-8 text-ink">{event.lesson}</p>
            </div>
          </aside>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {next && (
            <Link href={`/seerah/${next.id}`} className={buttonClass("primary", "lg")}>
              الفصل التالي: {next.title}
              <ArrowLeft className="size-5" aria-hidden />
            </Link>
          )}
          <Link href="/seerah" className={buttonClass("outline", "lg")}>
            الخط الزمني
          </Link>
        </div>
      </div>
    </div>
  );
}
