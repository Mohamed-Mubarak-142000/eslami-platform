"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { ERAS, SEERAH_EVENTS, eventById } from "./seerahContent";
import { useSeerah } from "./seerahStore";

/** The seerah from the birth to the passing: eras down a line, each event a station on it. */
export function SeerahTimeline() {
  const reduce = useReducedMotion();
  const { last, read } = useSeerah();
  const resume = last ? eventById(last.event) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      {resume && (
        <Link
          href={`/seerah/${resume.id}`}
          className="mb-10 flex items-center gap-4 rounded-3xl bg-emerald-deep p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <BookOpen className="size-7 shrink-0 text-gold" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-white/70">تابع من حيث وقفت</span>
            <span className="block font-bold">{resume.title}</span>
          </span>
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      )}

      {ERAS.map((era) => (
        <section key={era.id} className="relative mb-12" aria-labelledby={`era-${era.id}`}>
          <header className="sticky top-16 z-10 -mx-4 mb-6 flex items-baseline gap-3 bg-ivory/90 px-4 py-3 backdrop-blur">
            <h2 id={`era-${era.id}`} className="font-display text-2xl font-bold text-emerald-deep">
              {era.title}
            </h2>
            <span className="text-sm text-muted">{era.span}</span>
          </header>
          <ol className="relative space-y-5 border-s-2 border-line ps-8">
            {SEERAH_EVENTS.filter((event) => event.era === era.id).map((event) => {
              const ready = event.beats.length > 0;
              const done = read.includes(event.id);
              return (
                <motion.li
                  key={event.id}
                  className="relative"
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -start-[2.6rem] top-5 grid size-5 place-items-center rounded-full border-2",
                      done ? "border-emerald bg-emerald text-white" : ready ? "border-gold bg-gold" : "border-line bg-white",
                    )}
                  >
                    {done && <Check className="size-3" />}
                  </span>
                  <article className={cn("rounded-3xl border p-5", ready ? "border-gold/40 bg-white shadow-sm" : "border-line bg-ivory")}>
                    <p className="flex flex-wrap gap-x-3 text-xs text-muted">
                      <span className="font-bold text-gold-deep">{event.date}</span>
                      {event.age !== undefined && (
                        <span>
                          {event.exactAge ? "" : "نحو "}
                          {event.age ? `${toArabicDigits(event.age)} سنة من عمره ﷺ` : "مولده ﷺ"}
                        </span>
                      )}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-ink">{event.title}</h3>
                    <p className="mt-2 leading-8 text-muted">{event.summary}</p>
                    {ready ? (
                      <Link href={`/seerah/${event.id}`} className={buttonClass("gold", "sm", "mt-4")}>
                        {done ? "اقرأ الفصل مرة أخرى" : "ابدأ الفصل"}
                        <ArrowLeft className="size-4" aria-hidden />
                      </Link>
                    ) : (
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="size-3.5" aria-hidden />
                        الفصل التفاعلي قريبًا
                      </span>
                    )}
                  </article>
                </motion.li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
