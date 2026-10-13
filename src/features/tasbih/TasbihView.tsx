"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Expand,
  ListPlus,
  Palette,
  Plus,
  RotateCcw,
  Shrink,
  Trash2,
  Vibrate,
  VibrateOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PRESET_ADHKAR, TARGET_CHOICES, TASBIH_THEMES, type Dhikr } from "./tasbihData";
import { allAdhkar, countTap, currentDhikr, localDate, sessionOf, updateTasbih, useTasbih } from "./tasbihStore";
import { playBead, unlockBead } from "./beadSound";

const BEADS = 33;

export function TasbihView() {
  const state = useTasbih();
  const dhikr = currentDhikr(state);
  const session = sessionOf(state, dhikr);
  const theme = TASBIH_THEMES.find((entry) => entry.id === state.theme) ?? TASBIH_THEMES[0]!;
  const today = state.today.date === localDate() ? state.today.count : 0;
  const [sheet, setSheet] = useState<"adhkar" | "themes" | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const progress = session.target > 0 ? session.count / session.target : (session.count % BEADS) / BEADS;
  const litBeads = session.target > 0 ? Math.round(progress * BEADS) : session.count % BEADS;

  function tap() {
    const completed = countTap();
    if (state.sound) playBead(completed);
    if (state.vibrate) navigator.vibrate?.(completed ? [80, 60, 160] : 18);
    if (completed) setCelebrate((value) => value + 1);
  }

  function setTarget(target: number) {
    updateTasbih((current) => ({
      ...current,
      sessions: { ...current.sessions, [dhikr.id]: { ...sessionOf(current, dhikr), count: 0, target } },
    }));
  }

  function reset() {
    updateTasbih((current) => ({
      ...current,
      sessions: { ...current.sessions, [dhikr.id]: { ...sessionOf(current, dhikr), count: 0, rounds: 0 } },
    }));
  }

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen?.().catch(() => {});
  }

  const toolButton = "grid size-11 place-items-center rounded-full ring-1 transition-transform active:scale-90";
  const toolStyle = { backgroundColor: theme.face, color: theme.ink, "--tw-ring-color": theme.accent } as CSSProperties;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div
        ref={stageRef}
        className={cn(
          "relative isolate flex flex-col items-center overflow-hidden px-4 py-6 transition-[background] duration-700 sm:px-8",
          fullscreen ? "h-dvh justify-center" : "min-h-[38rem] rounded-[2rem] shadow-lift",
        )}
        style={{ background: theme.background, color: theme.ink }}
      >
        <button
          type="button"
          onClick={() => setSheet("adhkar")}
          className="flex w-full max-w-lg items-center justify-center gap-2 rounded-full px-5 py-3 text-center ring-2 transition-transform active:scale-[0.98]"
          style={{ backgroundColor: theme.accent, color: theme.face, "--tw-ring-color": theme.ink } as CSSProperties}
        >
          <span className="quran-text text-xl leading-9 sm:text-2xl">{dhikr.text}</span>
          <ChevronDown className="size-5 shrink-0" aria-hidden />
          <span className="sr-only">— تغيير الذكر</span>
        </button>
        {dhikr.note && (
          <p className="mt-2 text-center text-xs" style={{ color: theme.soft }}>
            {dhikr.note}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="عدد التكرار">
          {TARGET_CHOICES.map((target) => {
            const active = session.target === target;
            return (
              <button
                key={target}
                type="button"
                aria-pressed={active}
                onClick={() => setTarget(target)}
                className="rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition-colors"
                style={
                  {
                    backgroundColor: active ? theme.accent : "transparent",
                    color: active ? theme.face : theme.ink,
                    "--tw-ring-color": active ? theme.accent : theme.track,
                  } as CSSProperties
                }
              >
                {target === 0 ? "مفتوح" : toArabicDigits(target)}
              </button>
            );
          })}
          <CustomTarget
            current={session.target}
            onSet={setTarget}
            style={{ color: theme.ink, "--tw-ring-color": theme.track } as CSSProperties}
          />
        </div>

        <div className="mt-5 flex w-full max-w-lg items-center justify-between">
          <button type="button" onClick={() => setSheet("themes")} className={toolButton} style={toolStyle} aria-label="شكل السبحة">
            <Palette className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              unlockBead();
              updateTasbih((current) => ({ ...current, sound: !current.sound }));
            }}
            className={toolButton}
            style={toolStyle}
            aria-pressed={state.sound}
            aria-label="صوت الحبات"
          >
            {state.sound ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
          </button>
          <button type="button" onClick={reset} className={toolButton} style={toolStyle} aria-label="تصفير العدّاد">
            <RotateCcw className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => updateTasbih((current) => ({ ...current, vibrate: !current.vibrate }))}
            className={toolButton}
            style={toolStyle}
            aria-pressed={state.vibrate}
            aria-label="الاهتزاز"
          >
            {state.vibrate ? <Vibrate className="size-5" aria-hidden /> : <VibrateOff className="size-5" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={toolButton}
            style={toolStyle}
            aria-label={fullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
          >
            {fullscreen ? <Shrink className="size-5" aria-hidden /> : <Expand className="size-5" aria-hidden />}
          </button>
        </div>

        <div className="relative mt-6 aspect-square w-full max-w-[22rem]">
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
            {Array.from({ length: BEADS }, (_, index) => {
              const angle = (index / BEADS) * Math.PI * 2 - Math.PI / 2;
              const lit = index < litBeads;
              return (
                <motion.circle
                  key={index}
                  cx={100 + Math.cos(angle) * 92}
                  cy={100 + Math.sin(angle) * 92}
                  r={index === 0 ? 6 : 4.6}
                  initial={false}
                  animate={{ fill: lit ? theme.accent : theme.track, scale: lit && index === litBeads - 1 ? 1.25 : 1 }}
                  transition={{ duration: 0.25 }}
                  style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />
              );
            })}
          </svg>
          <motion.button
            type="button"
            onClick={tap}
            whileTap={{ scale: 0.94 }}
            className="absolute inset-[13%] grid place-items-center rounded-full outline-offset-4 touch-manipulation select-none"
            style={{ backgroundColor: theme.face, boxShadow: `0 20px 60px -20px ${theme.accent}66` }}
            aria-label={`سبّح — ${toArabicDigits(session.count)}${session.target ? ` من ${toArabicDigits(session.target)}` : ""}`}
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke={theme.track} strokeWidth="4" />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={theme.accent}
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                initial={false}
                animate={{ strokeDashoffset: 1 - progress, opacity: progress > 0 ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
              />
            </svg>
            <span className="relative flex flex-col items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={session.count}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="font-display text-6xl font-bold tabular-nums sm:text-7xl"
                  style={{ color: theme.ink }}
                >
                  {toArabicDigits(session.count)}
                </motion.span>
              </AnimatePresence>
              <span className="mt-1 text-sm" style={{ color: theme.soft }}>
                {session.target ? `من ${toArabicDigits(session.target)}` : "اضغط للتسبيح"}
              </span>
            </span>
          </motion.button>
          <AnimatePresence>
            {celebrate > 0 && (
              <motion.span
                key={celebrate}
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                onAnimationComplete={() => setCelebrate(0)}
                className="pointer-events-none absolute inset-[13%] rounded-full border-4"
                style={{ borderColor: theme.accent }}
                aria-hidden
              />
            )}
          </AnimatePresence>
        </div>

        <dl className="mt-6 grid w-full max-w-lg grid-cols-3 gap-2 text-center">
          <Stat label="الدورات" value={session.rounds} ink={theme.ink} soft={theme.soft} face={theme.face} />
          <Stat label="اليوم" value={today} ink={theme.ink} soft={theme.soft} face={theme.face} />
          <Stat label="الإجمالي" value={state.total} ink={theme.ink} soft={theme.soft} face={theme.face} />
        </dl>
        <p className="sr-only" aria-live="polite">
          {celebrate > 0 ? `أتممت دورة، عدد الدورات ${toArabicDigits(session.rounds)}` : ""}
        </p>
      </div>

      <p className="mt-4 text-center text-xs leading-6 text-muted">
        العدّ محفوظ على هذا الجهاز فقط. اضغط على الذكر لتغييره أو لإضافة ذكر خاص بك.
      </p>

      <Sheet open={sheet === "adhkar"} title="اختر الذكر" onClose={() => setSheet(null)}>
        <AdhkarPicker
          adhkar={allAdhkar(state)}
          customIds={new Set(state.custom.map((entry) => entry.id))}
          selectedId={dhikr.id}
          onPick={(id) => {
            updateTasbih((current) => ({ ...current, dhikrId: id }));
            setSheet(null);
          }}
        />
      </Sheet>
      <Sheet open={sheet === "themes"} title="شكل السبحة" onClose={() => setSheet(null)}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TASBIH_THEMES.map((entry) => {
            const active = entry.id === theme.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => updateTasbih((current) => ({ ...current, theme: entry.id }))}
                  aria-pressed={active}
                  className={cn(
                    "relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl ring-2 transition-transform active:scale-95",
                    active ? "ring-gold" : "ring-transparent",
                  )}
                  style={{ background: entry.background, color: entry.ink }}
                >
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2, 3, 4].map((bead) => (
                      <span key={bead} className="size-3 rounded-full" style={{ backgroundColor: bead < 3 ? entry.accent : entry.track }} />
                    ))}
                  </span>
                  <span className="text-sm font-bold">{entry.label}</span>
                  {active && <Check className="absolute end-3 top-3 size-4" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}

function Stat({ label, value, ink, soft, face }: { label: string; value: number; ink: string; soft: string; face: string }) {
  return (
    <div className="rounded-2xl px-2 py-3" style={{ backgroundColor: `${face}cc` }}>
      <dt className="text-xs" style={{ color: soft }}>
        {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-bold tabular-nums" style={{ color: ink }}>
        {toArabicDigits(value)}
      </dd>
    </div>
  );
}

function CustomTarget({ current, onSet, style }: { current: number; onSet: (target: number) => void; style: CSSProperties }) {
  const custom = !(TARGET_CHOICES as readonly number[]).includes(current);
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full px-3.5 py-1.5 text-sm font-bold ring-1"
        style={style}
        aria-pressed={custom}
      >
        {custom ? `${toArabicDigits(current)} ✎` : "عدد آخر"}
      </button>
    );
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        const value = Number(new FormData(event.currentTarget).get("target"));
        if (Number.isInteger(value) && value > 0) onSet(Math.min(value, 100000));
        setEditing(false);
      }}
    >
      <input
        name="target"
        type="number"
        inputMode="numeric"
        min={1}
        max={100000}
        autoFocus
        defaultValue={custom ? current : ""}
        aria-label="العدد المطلوب"
        className="w-24 rounded-full bg-white px-3 py-1.5 text-center text-sm font-bold text-ink"
      />
      <button type="submit" className="grid size-8 place-items-center rounded-full bg-white text-emerald" aria-label="حفظ العدد">
        <Check className="size-4" aria-hidden />
      </button>
    </form>
  );
}

function AdhkarPicker({
  adhkar,
  customIds,
  selectedId,
  onPick,
}: {
  adhkar: Dhikr[];
  customIds: Set<string>;
  selectedId: string;
  onPick: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {adding ? (
        <form
          className="space-y-3 rounded-3xl bg-emerald-mist p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const text = String(data.get("text") ?? "").trim();
            const target = Number(data.get("target")) || 0;
            if (!text) return;
            const id = `custom-${Date.now().toString(36)}`;
            updateTasbih((current) => ({
              ...current,
              custom: [{ id, text: text.slice(0, 300), target: Math.max(0, Math.min(target, 100000)) }, ...current.custom].slice(0, 50),
            }));
            setAdding(false);
            onPick(id);
          }}
        >
          <label className="block text-sm font-bold text-emerald-deep">
            نص الذكر
            <textarea
              name="text"
              required
              maxLength={300}
              rows={2}
              autoFocus
              className="mt-1 block w-full rounded-2xl border border-line bg-white p-3 text-ink"
              placeholder="مثال: سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ"
            />
          </label>
          <label className="block text-sm font-bold text-emerald-deep">
            العدد (اتركه فارغًا للعدّ المفتوح)
            <input
              name="target"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              className="mt-1 block w-full rounded-2xl border border-line bg-white p-3 text-ink"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("primary", "sm")}>
              <Plus aria-hidden /> إضافة
            </button>
            <button type="button" onClick={() => setAdding(false)} className={buttonClass("ghost", "sm")}>
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={buttonClass("outline", "sm", "w-full")}>
          <ListPlus aria-hidden /> أضف ذكرًا خاصًا بك
        </button>
      )}
      <ul className="space-y-2">
        {adhkar.map((entry) => {
          const active = entry.id === selectedId;
          const custom = customIds.has(entry.id);
          return (
            <li key={entry.id} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => onPick(entry.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-1 items-center justify-between gap-3 rounded-2xl border p-3 text-start transition-colors",
                  active ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                )}
              >
                <span>
                  <span className="quran-text block text-lg leading-8 text-emerald-deep">{entry.text}</span>
                  {custom && <span className="text-xs font-bold text-gold-deep">ذكر خاص</span>}
                </span>
                <span className="shrink-0 rounded-full bg-gold-mist px-2.5 py-0.5 text-xs font-bold text-gold-deep">
                  {entry.target ? `×${toArabicDigits(entry.target)}` : "مفتوح"}
                </span>
              </button>
              {custom && (
                <button
                  type="button"
                  onClick={() =>
                    updateTasbih((current) => {
                      const sessions = Object.fromEntries(Object.entries(current.sessions).filter(([id]) => id !== entry.id));
                      return {
                        ...current,
                        custom: current.custom.filter((item) => item.id !== entry.id),
                        sessions,
                        dhikrId: current.dhikrId === entry.id ? PRESET_ADHKAR[0]!.id : current.dhikrId,
                      };
                    })
                  }
                  className="grid w-11 place-items-center rounded-2xl border border-line bg-white text-muted hover:text-rose"
                  aria-label={`حذف ${entry.text}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto mb-0 max-h-[85dvh] w-full max-w-xl rounded-t-[2rem] bg-ivory p-0 text-ink shadow-lift backdrop:bg-emerald-night/60 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-[2rem]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ivory px-5 py-4">
        <h2 className="text-lg font-bold text-emerald-deep">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full hover:bg-emerald-mist"
          aria-label="إغلاق"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
