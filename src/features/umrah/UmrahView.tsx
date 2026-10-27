"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { AArrowDown, AArrowUp, Check, ChevronLeft, ChevronRight, Landmark, Plane, RotateCcw, Route } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { BlockView } from "./Blocks";
import { MEDINA_SECTIONS, TRAVEL_DUAS, UMRAH_STEPS } from "./umrahGuide";
import { MAX_SCALE, MIN_SCALE, updateUmrah, useUmrah } from "./umrahStore";

type Tab = "guide" | "travel" | "medina";
const TABS: { id: Tab; label: string; icon: typeof Route }[] = [
  { id: "guide", label: "دليل العمرة", icon: Route },
  { id: "travel", label: "أدعية السفر", icon: Plane },
  { id: "medina", label: "زيارة المدينة", icon: Landmark },
];

/** The journey as a path of stations: a strip that scrolls on phones, a column beside the step on wide screens. */
function JourneyPath({ current, done, onPick }: { current: string; done: string[]; onPick: (id: string) => void }) {
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the current station in view on the phone strip.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);

  return (
    <nav aria-label="مراحل العمرة">
      <ol
        ref={listRef}
        className="no-scrollbar -mx-4 flex snap-x gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
      >
        {UMRAH_STEPS.map((step, index) => {
          const active = step.id === current;
          const finished = done.includes(step.id);
          const Icon = step.icon;
          const last = index === UMRAH_STEPS.length - 1;
          return (
            <li key={step.id} className="relative shrink-0 snap-center lg:shrink">
              {/* The road between stations: across on phones, down on wide screens. */}
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-1/2 top-7 h-0.5 w-full lg:right-[1.69rem] lg:top-12 lg:h-full lg:w-0.5",
                    finished ? "bg-emerald" : "bg-line",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onPick(step.id)}
                aria-current={active ? "step" : undefined}
                className="relative flex w-24 flex-col items-center gap-1.5 rounded-2xl p-1 text-center lg:w-full lg:flex-row lg:gap-3 lg:py-2 lg:text-start"
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    active
                      ? "border-gold bg-gold text-emerald-night shadow-gold"
                      : finished
                        ? "border-emerald bg-emerald text-white"
                        : "border-line bg-white text-muted",
                  )}
                >
                  {finished && !active ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-xs leading-5", active ? "font-bold text-emerald-deep" : "text-muted")}>{step.title}</span>
                  <span className="hidden text-[0.7rem] text-muted lg:block">{step.place}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Guide() {
  const state = useUmrah();
  const reduce = useReducedMotion();
  const index = Math.max(
    0,
    UMRAH_STEPS.findIndex((step) => step.id === state.step),
  );
  const step = UMRAH_STEPS[index]!;
  const previous = UMRAH_STEPS[index - 1];
  const next = UMRAH_STEPS[index + 1];
  const [direction, setDirection] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const Icon = step.icon;

  function go(id: string, markDone = false) {
    const target = UMRAH_STEPS.findIndex((entry) => entry.id === id);
    setDirection(target >= index ? 1 : -1);
    updateUmrah((current) => ({
      ...current,
      step: id,
      done: markDone && !current.done.includes(step.id) ? [...current.done, step.id] : current.done,
    }));
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const progress = state.done.length;
  return (
    <div ref={topRef} className="scroll-mt-24 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <JourneyPath current={step.id} done={state.done} onPick={(id) => go(id)} />
        <div className="mt-3 hidden items-center justify-between text-xs text-muted lg:flex">
          <span>
            أتممت {toArabicDigits(progress)} من {toArabicDigits(UMRAH_STEPS.length)}
          </span>
          {progress > 0 && (
            <button
              type="button"
              onClick={() =>
                window.confirm("البدء من أول الرحلة؟ يُصفَّر التقدّم وعدّادا الطواف والسعي.") &&
                updateUmrah((current) => ({ ...current, step: UMRAH_STEPS[0]!.id, done: [], tawaf: 0, sai: 0 }))
              }
              className="inline-flex items-center gap-1 hover:text-rose"
            >
              <RotateCcw className="size-3.5" aria-hidden /> من البداية
            </button>
          )}
        </div>
      </aside>

      <div className="mt-4 lg:mt-0">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.article
            key={step.id}
            initial={reduce ? false : { opacity: 0, x: direction * -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
            transition={{ duration: 0.25 }}
            aria-labelledby="umrah-step-title"
            style={{ zoom: state.scale }}
          >
            <header className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-deep text-gold">
                <Icon className="size-7" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-gold-deep">{step.place}</p>
                <h2 id="umrah-step-title" className="mt-0.5 font-display text-2xl font-bold leading-snug text-emerald-deep sm:text-3xl">
                  {step.title}
                </h2>
              </div>
            </header>
            <p className="mt-4 text-lg leading-9 text-ink">{step.summary}</p>
            <div className="mt-6 space-y-5">
              {step.blocks.map((block, blockIndex) => (
                <BlockView key={blockIndex} block={block} />
              ))}
            </div>
          </motion.article>
        </AnimatePresence>

        <div className="sticky bottom-3 z-20 mt-8 flex items-center gap-2 rounded-full border border-line bg-white/95 p-2 shadow-lift backdrop-blur">
          <button
            type="button"
            onClick={() => previous && go(previous.id)}
            disabled={!previous}
            className={buttonClass("ghost", "md", "shrink-0")}
            aria-label={previous ? `الخطوة السابقة: ${previous.title}` : "لا خطوة قبلها"}
          >
            <ChevronRight aria-hidden /> <span className="hidden sm:inline">السابق</span>
          </button>
          <div className="flex shrink-0 items-center" role="group" aria-label="حجم الخط">
            <button
              type="button"
              onClick={() => updateUmrah((current) => ({ ...current, scale: Math.max(MIN_SCALE, +(current.scale - 0.1).toFixed(1)) }))}
              disabled={state.scale <= MIN_SCALE}
              className="grid size-10 place-items-center rounded-full text-muted hover:bg-emerald-mist hover:text-ink disabled:opacity-40"
              aria-label="تصغير الخط"
            >
              <AArrowDown className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => updateUmrah((current) => ({ ...current, scale: Math.min(MAX_SCALE, +(current.scale + 0.1).toFixed(1)) }))}
              disabled={state.scale >= MAX_SCALE}
              className="grid size-10 place-items-center rounded-full text-muted hover:bg-emerald-mist hover:text-ink disabled:opacity-40"
              aria-label="تكبير الخط"
            >
              <AArrowUp className="size-5" aria-hidden />
            </button>
          </div>
          {next ? (
            <button
              type="button"
              onClick={() => go(next.id, true)}
              className={buttonClass("primary", "md", "ms-auto min-w-0 flex-1 sm:flex-none")}
            >
              <Check aria-hidden />
              <span className="truncate">
                التالي<span className="hidden sm:inline">: {next.title}</span>
              </span>
              <ChevronLeft aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updateUmrah((current) => ({ ...current, done: [...new Set([...current.done, step.id])] }))}
              className={buttonClass("gold", "md", "ms-auto")}
            >
              <Check aria-hidden /> تمّت عمرتي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TravelDuas() {
  const { scale } = useUmrah();
  return (
    <div className="mx-auto max-w-3xl space-y-4" style={{ zoom: scale }}>
      <p className="text-lg leading-9 text-ink">أدعية الطريق بترتيب الرحلة، من وداع أهلك إلى رجوعك إليهم، كلها من حصن المسلم وبصوت قارئ.</p>
      {TRAVEL_DUAS.map((dua) => (
        <BlockView key={dua.id} block={{ kind: "dua", id: dua.id, when: dua.when }} />
      ))}
    </div>
  );
}

function Medina() {
  const { scale } = useUmrah();
  return (
    <div className="mx-auto max-w-3xl space-y-10" style={{ zoom: scale }}>
      {MEDINA_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`medina-${section.id}`}>
          <h2 id={`medina-${section.id}`} className="font-display text-2xl font-bold text-emerald-deep">
            {section.title}
          </h2>
          <p className="mt-2 text-lg leading-9 text-ink">{section.summary}</p>
          <div className="mt-4 space-y-4">
            {section.blocks.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function UmrahView() {
  const [tab, setTab] = useState<Tab>("guide");
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <LayoutGroup>
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="أقسام العمرة والسفر">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  "relative isolate inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                  active ? "text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="umrah-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-emerald shadow-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {tab === "guide" ? <Guide /> : tab === "travel" ? <TravelDuas /> : <Medina />}
      <p className="mt-12 text-center text-xs leading-6 text-muted">
        الأدعية من حصن المسلم بتسجيلاته، والأحاديث بدرجاتها من موسوعة الأحاديث النبوية. هذا دليل مختصر؛ وما أشكل عليك فاسأل عنه أهل العلم.
      </p>
    </div>
  );
}
