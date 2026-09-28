"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, CloudMoon, Moon, RotateCcw, Sparkles, Sun, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { AdhkarToastToggle } from "./AdhkarToaster";
import { DUA_CATEGORY_LABELS, DUAS, type Dua, type DuaCategory } from "./duasData";

const CATEGORY_ICONS: Record<DuaCategory, LucideIcon> = {
  morning: Sun,
  evening: CloudMoon,
  sleep: Moon,
  "after-prayer": Sparkles,
  general: Sparkles,
};
const ORDER: DuaCategory[] = ["morning", "evening", "after-prayer", "sleep", "general"];

const noopSubscribe = () => () => {};
const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

function defaultCategory(): DuaCategory {
  const hour = new Date().getHours();
  return hour >= 4 && hour < 15 ? "morning" : "evening";
}

export function AdhkarView() {
  const initial = useSyncExternalStore(noopSubscribe, defaultCategory, () => "morning" as DuaCategory);
  const [chosen, setChosen] = useState<DuaCategory | null>(null);
  const category = chosen ?? initial;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const canSpeak = useSyncExternalStore(noopSubscribe, speechSupported, () => false);

  const list = useMemo(() => DUAS.filter((dua) => dua.category === category), [category]);
  const done = list.filter((dua) => (counts[dua.id] ?? 0) >= (dua.repeat ?? 1)).length;

  function speak(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = window.speechSynthesis.getVoices().find((entry) => entry.lang.startsWith("ar"));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "ar";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <LayoutGroup>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="أقسام الأذكار">
          {ORDER.map((key) => {
            const Icon = CATEGORY_ICONS[key];
            const active = key === category;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setChosen(key)}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                  active ? "text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="adhkar-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-emerald shadow-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="size-4" aria-hidden /> {DUA_CATEGORY_LABELS[key]}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-emerald-mist">
            <motion.div
              className="h-full rounded-full bg-emerald"
              animate={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm font-bold text-emerald-deep">
            {toArabicDigits(done)} من {toArabicDigits(list.length)}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setCounts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !list.some((dua) => dua.id === id))))
          }
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"
        >
          <RotateCcw className="size-4" aria-hidden /> إعادة القسم
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={category}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          {list.map((dua) => (
            <DhikrCard
              key={dua.id}
              dua={dua}
              count={counts[dua.id] ?? 0}
              canSpeak={canSpeak}
              onSpeak={() => speak(dua.text)}
              onTap={() => setCounts((current) => ({ ...current, [dua.id]: Math.min(dua.repeat ?? 1, (current[dua.id] ?? 0) + 1) }))}
              onReset={() => setCounts((current) => ({ ...current, [dua.id]: 0 }))}
            />
          ))}
        </motion.ul>
      </AnimatePresence>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-gold/50 bg-gold-mist/50 p-6 text-center">
        <AdhkarToastToggle />
        <p className="max-w-xl text-xs leading-6 text-muted">
          المحتوى نماذج مختارة من أذكار مشهورة بمصادرها، وتحتاج مراجعة من مختص قبل الاعتماد النهائي. عدد التكرار يظهر فقط حيث ورد في المصدر.
        </p>
      </div>
    </div>
  );
}

function DhikrCard({
  dua,
  count,
  canSpeak,
  onTap,
  onReset,
  onSpeak,
}: {
  dua: Dua;
  count: number;
  canSpeak: boolean;
  onTap: () => void;
  onReset: () => void;
  onSpeak: () => void;
}) {
  const target = dua.repeat ?? 1;
  const complete = count >= target;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <li
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[1.75rem] border bg-white p-5 transition-colors duration-500",
        complete ? "border-emerald/40 bg-emerald-mist" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gold-deep">{dua.title}</p>
        {dua.repeat && (
          <span className="rounded-full bg-gold-mist px-2.5 py-0.5 text-xs font-bold text-gold-deep">
            تكرار ×{toArabicDigits(dua.repeat)}
          </span>
        )}
      </div>
      <p className="quran-text mt-3 flex-1 text-2xl leading-[2.1] text-emerald-deep">{dua.text}</p>
      <p className="mt-2 text-xs text-muted">{dua.source}</p>
      <div className="mt-4 flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onTap}
          disabled={complete}
          aria-label={`اضغط للعدّ — ${toArabicDigits(count)} من ${toArabicDigits(target)}`}
          className="relative grid size-16 shrink-0 place-items-center rounded-full disabled:cursor-default"
        >
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill={complete ? "var(--color-emerald)" : "white"}
              stroke="var(--color-emerald-soft)"
              strokeWidth="5"
            />
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - count / target) }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </svg>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={complete ? "done" : count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              className={cn("relative font-display text-lg font-bold", complete ? "text-white" : "text-emerald-deep")}
            >
              {complete ? <Check className="size-6" aria-hidden /> : toArabicDigits(count)}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <p className="flex-1 text-xs text-muted">
          {complete
            ? "أحسنت، أتممت هذا الذكر"
            : target > 1
              ? `اضغط الدائرة مع كل مرة (${toArabicDigits(target - count)} متبقية)`
              : "اضغط الدائرة عند الانتهاء"}
        </p>
        {canSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-white hover:text-emerald"
            aria-label="استماع بالنطق الآلي"
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
        )}
        {count > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-white hover:text-ink"
            aria-label="إعادة العدّاد"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
