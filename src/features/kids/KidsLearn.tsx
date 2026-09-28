"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Pointer,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useAudio } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { husaryAyahUrl, husaryMuallimAyahUrl } from "@/features/quran/ayahAudio";
import type { Surah } from "@/features/quran/api";
import type { Ayah, TafsirAyah } from "@/features/quran/textApi";
import { useKidsProgress } from "./progress/KidsProgressProvider";
import { ReciteRecorder } from "./ReciteRecorder";
import { Celebration } from "./ui/Celebration";
import { kidsButton } from "./ui/kidsStyles";
import { sfx } from "./sfx";
import type { TeachingTrack } from "./kidsData";

type Mode = "muallim" | "plain";
interface Settings {
  repeat: 1 | 3 | 5;
  autoAdvance: boolean;
}

const STEP_GROUP = 10;

interface PlaybackContext {
  audio: ReturnType<typeof useAudio>;
  ayahs: Ayah[];
  surah: Surah;
  repeats: RefObject<number>;
  settings: RefObject<Settings>;
  onAdvance: (index: number) => void;
  onFinished: () => void;
}

// Module-level (not component) functions so the replay → next-ayah chain can recurse freely.
function startAyah(ctx: PlaybackContext, index: number, mode: Mode, resetRepeats = true) {
  const ayah = ctx.ayahs[index];
  if (!ayah) return;
  if (resetRepeats) ctx.repeats.current = 0;
  ctx.audio.play(
    {
      id: `kids-${mode}-${ayah.number}`,
      kind: "ayah",
      title: `سورة ${ctx.surah.name} — الآية ${toArabicDigits(ayah.numberInSurah)}`,
      subtitle: mode === "muallim" ? "الحصري — المصحف المعلّم" : "الحصري — مرتّل",
      src: mode === "muallim" ? husaryMuallimAyahUrl(ctx.surah.id, ayah.numberInSurah) : husaryAyahUrl(ayah.number),
      href: `/kids/learn/${ctx.surah.id}`,
    },
    { onEnded: () => onAyahEnded(ctx, index, mode) },
  );
}

function onAyahEnded(ctx: PlaybackContext, index: number, mode: Mode) {
  ctx.repeats.current += 1;
  if (ctx.repeats.current < ctx.settings.current.repeat) {
    startAyah(ctx, index, mode, false);
    return;
  }
  if (index === ctx.ayahs.length - 1) {
    ctx.onFinished();
    return;
  }
  if (ctx.settings.current.autoAdvance) {
    ctx.onAdvance(index + 1);
    startAyah(ctx, index + 1, mode);
  }
}

interface KidsLearnProps {
  surah: Surah;
  ayahs: Ayah[];
  basmala: string | null;
  tafsir: TafsirAyah[];
  surahs: Surah[];
  teaching: TeachingTrack | null;
}

export function KidsLearn({ surah, ayahs, basmala, tafsir, surahs, teaching }: KidsLearnProps) {
  const audio = useAudio();
  const { state, setAyahMemorized, recordListenCompletion } = useKidsProgress();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [panel, setPanel] = useState<"tafsir" | "settings" | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({ repeat: 1, autoAdvance: true });
  const [celebrate, setCelebrate] = useState<"listened" | "memorized" | null>(null);
  const settingsRef = useRef<Settings>(settings);
  const repeatsRef = useRef(0);
  const audioRef = useRef(audio);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    audioRef.current = audio;
  });
  useEffect(
    () => () => {
      if (audioRef.current.track?.id.startsWith("kids-")) audioRef.current.stop();
    },
    [],
  );

  const ayah = ayahs[index];
  const memorized = new Set(state.memorizedAyahsBySurah[surah.id] ?? []);
  const group = Math.floor(index / STEP_GROUP);
  const groupAyahs = ayahs.slice(group * STEP_GROUP, group * STEP_GROUP + STEP_GROUP);
  const groups = Math.ceil(ayahs.length / STEP_GROUP);

  const ctx: PlaybackContext = {
    audio,
    ayahs,
    surah,
    repeats: repeatsRef,
    settings: settingsRef,
    onAdvance: (next) => {
      setDirection(1);
      setIndex(next);
    },
    onFinished: () => {
      recordListenCompletion(surah.id);
      sfx.win();
      setCelebrate("listened");
    },
  };

  function goTo(next: number) {
    if (next < 0 || next >= ayahs.length || next === index) return;
    if (audio.track?.id.startsWith("kids-") && audio.playing) audio.pause();
    setDirection(next > index ? 1 : -1);
    setIndex(next);
    setPanel((current) => (current === "tafsir" ? current : null));
    sfx.tap();
  }

  function playMode(mode: Mode) {
    if (!ayah) return;
    const id = `kids-${mode}-${ayah.number}`;
    if (audio.isCurrent(id)) {
      audio.toggle();
      return;
    }
    startAyah(ctx, index, mode);
  }

  function toggleMemorized() {
    if (!ayah) return;
    const next = !memorized.has(ayah.numberInSurah);
    setAyahMemorized(surah.id, ayah.numberInSurah, next);
    if (!next) return;
    sfx.correct();
    if (memorized.size + 1 >= ayahs.length) setCelebrate("memorized");
  }

  const teachingId = `kids-teach-${surah.id}`;
  const teachingOn = audio.isCurrent(teachingId);

  function playTeaching() {
    if (!teaching) return;
    if (teachingOn) {
      audio.toggle();
      return;
    }
    audio.play({
      id: teachingId,
      kind: "surah",
      title: `سورة ${surah.name} مع الأطفال`,
      subtitle: teaching.reciterName,
      src: teaching.src,
      href: `/kids/learn/${surah.id}`,
    });
  }

  if (!ayah) {
    return (
      <p className="rounded-[2rem] bg-white/95 p-8 text-center text-lg text-muted shadow-lift">
        تعذّر تحميل آيات السورة الآن، جرّب بعد قليل.
      </p>
    );
  }

  const modeState = (mode: Mode) => ({
    current: audio.isCurrent(`kids-${mode}-${ayah.number}`),
    playing: audio.isCurrent(`kids-${mode}-${ayah.number}`) && audio.playing,
    loading: audio.isCurrent(`kids-${mode}-${ayah.number}`) && audio.loading,
  });
  const muallim = modeState("muallim");
  const plain = modeState("plain");
  const tafsirText = tafsir.find((entry) => entry.numberInSurah === ayah.numberInSurah)?.text;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="sr-only">تعلّم سورة {surah.name}</h1>
      <div className="relative mx-auto w-fit">
        <button
          type="button"
          onClick={() => setSwitcherOpen((open) => !open)}
          aria-expanded={switcherOpen}
          className="relative flex items-center gap-2 rounded-full bg-white px-8 py-3 shadow-lift ring-4 ring-[#b9ecd3]"
        >
          <span className="quran-text text-3xl leading-tight text-[#0f7a46] sm:text-4xl">سورة {surah.name}</span>
          <ChevronDown className={cn("size-5 text-muted transition-transform", switcherOpen && "rotate-180")} aria-hidden />
          <span className="absolute -left-3 -top-3 rotate-[-8deg] rounded-full bg-[#f5c542] px-3 py-0.5 text-xs font-extrabold text-[#5a3d00] shadow">
            {surah.meccan ? "سورة مكية" : "سورة مدنية"}
          </span>
        </button>
        <AnimatePresence>
          {switcherOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="absolute left-1/2 top-full z-20 mt-3 grid max-h-80 w-72 -translate-x-1/2 grid-cols-2 gap-1.5 overflow-y-auto rounded-3xl bg-white p-3 shadow-lift"
            >
              {surahs.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/kids/learn/${entry.id}` as Route}
                    className={cn(
                      "block rounded-2xl px-3 py-2 text-center font-extrabold",
                      entry.id === surah.id ? "bg-[#12a15b] text-white" : "hover:bg-emerald-mist",
                    )}
                  >
                    {entry.name}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <nav aria-label="آيات السورة" className="mt-8 flex items-center justify-center gap-2">
        {groups > 1 && (
          <button
            type="button"
            onClick={() => goTo(Math.max(0, (group - 1) * STEP_GROUP))}
            disabled={group === 0}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/90 shadow disabled:opacity-30"
            aria-label="الآيات السابقة"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        )}
        <div className="relative flex items-center">
          <span className="absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/80 shadow-inner" aria-hidden />
          <ol className="relative flex items-center gap-2 sm:gap-3">
            {groupAyahs.map((entry) => {
              const entryIndex = ayahs.indexOf(entry);
              const active = entryIndex === index;
              const done = memorized.has(entry.numberInSurah);
              return (
                <li key={entry.number} className="relative">
                  <motion.button
                    type="button"
                    onClick={() => goTo(entryIndex)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`الآية ${toArabicDigits(entry.numberInSurah)}${done ? " — محفوظة" : ""}`}
                    animate={{ scale: active ? 1.25 : 1 }}
                    whileHover={{ scale: active ? 1.3 : 1.1 }}
                    className={cn(
                      "grid size-11 place-items-center rounded-full text-lg font-extrabold shadow-md ring-4 transition-colors sm:size-13",
                      active
                        ? "bg-[#e84a67] text-white ring-white"
                        : done
                          ? "bg-[#12a15b] text-white ring-white/80"
                          : "bg-white text-muted ring-[#e8ece4]",
                    )}
                  >
                    {done && !active ? <Check className="size-5" aria-hidden /> : toArabicDigits(entry.numberInSurah)}
                  </motion.button>
                  {active && (
                    <motion.span
                      layoutId="kids-pointer"
                      className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[#f5b92e]"
                      aria-hidden
                    >
                      <motion.span className="block" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                        <Pointer className="size-7 fill-[#ffd66b] drop-shadow" />
                      </motion.span>
                    </motion.span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {groups > 1 && (
          <button
            type="button"
            onClick={() => goTo(Math.min(ayahs.length - 1, (group + 1) * STEP_GROUP))}
            disabled={group === groups - 1}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/90 shadow disabled:opacity-30"
            aria-label="الآيات التالية"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        )}
      </nav>

      <div className="relative mt-12">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="absolute -right-3 top-24 z-10 grid size-12 place-items-center rounded-full bg-white text-emerald-deep shadow-lift disabled:opacity-0 sm:-right-6"
          aria-label="الآية السابقة"
        >
          <ChevronRight className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === ayahs.length - 1}
          className="absolute -left-3 top-24 z-10 grid size-12 place-items-center rounded-full bg-white text-emerald-deep shadow-lift disabled:opacity-0 sm:-left-6"
          aria-label="الآية التالية"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>

        <section className="relative overflow-hidden rounded-[2.75rem] bg-white/95 px-5 pb-8 pt-7 shadow-[0_30px_80px_-30px_rgb(0_62_50/55%)] ring-4 ring-white/70 backdrop-blur sm:px-10">
          <span className="absolute -left-10 -top-10 size-28 rounded-full bg-[#ffd9df]" aria-hidden />
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={ayah.number}
              initial={{ opacity: 0, x: direction * -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * 50 }}
              transition={{ duration: 0.3 }}
              className="relative text-center"
            >
              <span className="inline-block rounded-full bg-[#eef1ec] px-4 py-1 text-sm font-extrabold text-muted">
                الآية {toArabicDigits(ayah.numberInSurah)}
              </span>
              {index === 0 && basmala && <p className="quran-text mt-4 text-xl text-muted">{basmala}</p>}
              <p className="quran-text mt-4 text-4xl leading-[1.9] text-[#1b2a24] sm:text-5xl sm:leading-[1.9]">{ayah.text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="relative mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setPanel((current) => (current === "tafsir" ? null : "tafsir"))}
              aria-expanded={panel === "tafsir"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold ring-2",
                panel === "tafsir" ? "bg-emerald-mist text-emerald-deep ring-emerald/40" : "bg-white text-muted ring-[#e2e8df]",
              )}
            >
              <BookOpen className="size-4" aria-hidden /> تفسير الآية (للكبار)
            </button>
            <button
              type="button"
              onClick={() => setPanel((current) => (current === "settings" ? null : "settings"))}
              aria-expanded={panel === "settings"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold ring-2",
                panel === "settings" ? "bg-emerald-mist text-emerald-deep ring-emerald/40" : "bg-white text-muted ring-[#e2e8df]",
              )}
            >
              <Settings className="size-4" aria-hidden /> إعدادات التلاوة
            </button>
            <button
              type="button"
              onClick={toggleMemorized}
              aria-pressed={memorized.has(ayah.numberInSurah)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold ring-2",
                memorized.has(ayah.numberInSurah) ? "bg-[#fff6d8] text-[#8a5a00] ring-[#f5c542]" : "bg-white text-muted ring-[#e2e8df]",
              )}
            >
              <Star className={cn("size-4", memorized.has(ayah.numberInSurah) && "fill-[#f5c542] text-[#e0a800]")} aria-hidden />{" "}
              {memorized.has(ayah.numberInSurah) ? "حفظتها!" : "حفظتُ هذه الآية"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {panel === "tafsir" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mx-auto mt-4 max-w-xl rounded-3xl bg-ivory p-4 text-start font-sans text-base leading-8 text-ink/85">
                  <span className="block text-xs font-bold text-gold-deep">التفسير الميسّر</span>
                  {tafsirText ?? "التفسير غير متاح الآن."}
                </p>
              </motion.div>
            )}
            {panel === "settings" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-4 max-w-md space-y-4 rounded-3xl bg-ivory p-4 text-start">
                  <div>
                    <p className="text-sm font-extrabold text-emerald-deep">كم مرة تتكرر الآية؟</p>
                    <div className="mt-2 flex gap-2">
                      {([1, 3, 5] as const).map((count) => (
                        <button
                          key={count}
                          type="button"
                          aria-pressed={settings.repeat === count}
                          onClick={() => setSettings((current) => ({ ...current, repeat: count }))}
                          className={cn(
                            "flex-1 rounded-2xl py-2 font-extrabold",
                            settings.repeat === count ? "bg-[#12a15b] text-white" : "bg-white text-muted",
                          )}
                        >
                          {toArabicDigits(count)} {count === 1 ? "مرة" : "مرات"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-pressed={settings.autoAdvance}
                    onClick={() => setSettings((current) => ({ ...current, autoAdvance: !current.autoAdvance }))}
                    className="flex w-full items-center justify-between rounded-2xl bg-white p-3 font-extrabold text-emerald-deep"
                  >
                    انتقل للآية التالية تلقائيًا
                    <span
                      className={cn("relative h-7 w-12 rounded-full transition-colors", settings.autoAdvance ? "bg-[#12a15b]" : "bg-line")}
                    >
                      <motion.span
                        layout
                        className={cn("absolute top-1 size-5 rounded-full bg-white shadow", settings.autoAdvance ? "left-1" : "right-1")}
                      />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mt-7 rounded-[2rem] bg-[#f3f5f1] px-4 pb-5 pt-9">
            <span
              className="absolute left-1/2 top-0 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl shadow-md"
              aria-hidden
            >
              <BookOpen className="size-7 text-[#1f9be0]" />
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => playMode("muallim")} className={kidsButton("emerald", "h-auto flex-col gap-0.5 py-3.5")}>
                <span className="inline-flex items-center gap-2 text-xl">
                  {muallim.loading ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : muallim.playing ? (
                    <Pause className="fill-current" aria-hidden />
                  ) : (
                    <Play className="fill-current" aria-hidden />
                  )}
                  الشيخ مع التكرار
                  {muallim.playing && <EqualizerBars active className="h-4" />}
                </span>
                <span className="text-xs font-bold opacity-85">الحصري — المصحف المعلّم</span>
              </button>
              <button type="button" onClick={() => playMode("plain")} className={kidsButton("sky", "h-auto flex-col gap-0.5 py-3.5")}>
                <span className="inline-flex items-center gap-2 text-xl">
                  {plain.loading ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : plain.playing ? (
                    <Pause className="fill-current" aria-hidden />
                  ) : (
                    <Play className="fill-current" aria-hidden />
                  )}
                  الشيخ فقط
                  {plain.playing && <EqualizerBars active className="h-4" />}
                </span>
                <span className="text-xs font-bold opacity-85">الحصري — تلاوة</span>
              </button>
            </div>
            {teaching && (
              <button type="button" onClick={playTeaching} className={kidsButton("gold", "mt-3 w-full py-3 text-base")}>
                {teachingOn && audio.playing ? <Pause className="fill-current" aria-hidden /> : <Users aria-hidden />}
                {teachingOn && audio.playing ? "إيقاف السورة" : "استمع للسورة كاملة مع الأطفال"}
                <span className="text-xs font-bold opacity-80">({teaching.reciterName})</span>
              </button>
            )}
            {audio.error && audio.track?.id.startsWith("kids-") && (
              <p className="mt-3 text-center text-sm font-bold text-[#b92f49]">{audio.error}</p>
            )}
          </div>

          <div className="mt-6">
            <ReciteRecorder key={ayah.number} />
          </div>
        </section>
      </div>

      <Celebration
        open={celebrate !== null}
        title={celebrate === "memorized" ? "ما شاء الله! حفظت السورة" : "أحسنت! أكملت السورة"}
        message={celebrate === "memorized" ? `أتممت حفظ سورة ${surah.name} كاملة` : `استمعت لسورة ${surah.name} كاملة`}
        stars={3}
      >
        <button type="button" onClick={() => setCelebrate(null)} className={kidsButton("emerald")}>
          أكمل
        </button>
        <Link href="/kids/learn" className={kidsButton("white")}>
          سورة أخرى
        </Link>
      </Celebration>
    </div>
  );
}
