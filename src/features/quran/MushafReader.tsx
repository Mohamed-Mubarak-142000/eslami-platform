"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, BookText, ChevronLeft, ChevronRight, Loader2, Minus, Palette, Pause, Play, Plus, Settings2, X } from "lucide-react";
import { useAudio } from "@/features/audio/AudioProvider";
import { gsap, useGSAP, FULL_MOTION, REDUCED_MOTION } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useCoarsePointer } from "@/lib/useCoarsePointer";
import { AyahSheet } from "./AyahSheet";
import { MushafFrame, SurahBanner } from "./MushafFrame";
import { saveLastRead } from "./lastReadStorage";
import { TAJWEED_RULES, type TajweedAyah } from "./tajweedApi";
import type { Ayah, MushafPage, TafsirAyah } from "./textApi";
import { RIWAYAT, RIWAYA_STORAGE_KEY, type RiwayaKey } from "./riwayat";

type ReaderTheme = "light" | "sepia" | "night";

const THEMES: Record<ReaderTheme, { label: string; vars: CSSProperties; shell: string }> = {
  light: {
    label: "فاتح",
    shell: "bg-ivory text-ink",
    vars: { "--page-bg": "#fffdf7", "--page-ink": "#1b2a24", "--frame-bg": "#f1e7cc", "--page-accent": "#9c7a26" } as CSSProperties,
  },
  sepia: {
    label: "دافئ",
    shell: "bg-[#eadcb9] text-[#3b2f1b]",
    vars: { "--page-bg": "#f6ead0", "--page-ink": "#3b2f1b", "--frame-bg": "#e2cf9e", "--page-accent": "#8a6a1f" } as CSSProperties,
  },
  night: {
    label: "ليلي",
    shell: "bg-[#06110d] text-[#e9e3cf]",
    vars: { "--page-bg": "#0d1d18", "--page-ink": "#ebe5d1", "--frame-bg": "#132b24", "--page-accent": "#d9b35a" } as CSSProperties,
  },
};

const FONT_STEPS = [1.4, 1.65, 1.9, 2.2, 2.55];
const HIZB_PARTS = ["", "ربع ", "نصف ", "ثلاثة أرباع "];

function hizbLabel(hizbQuarter: number): string {
  const hizb = Math.ceil(hizbQuarter / 4);
  const part = (hizbQuarter - 1) % 4;
  return `${HIZB_PARTS[part] ?? ""}الحزب ${toArabicDigits(hizb)}`;
}

interface SurahRef {
  id: number;
  name: string;
}

interface MushafReaderProps {
  surah: SurahRef & { meccan: boolean };
  basmala: string | null;
  pages: MushafPage[];
  tafsir: TafsirAyah[];
  tajweed: TajweedAyah[];
  initialMushafPage: number | null;
  previousSurah: SurahRef | null;
  nextSurah: SurahRef | null;
  riwaya: { key: RiwayaKey; label: string; short: string };
  /** The chosen riwaya's text couldn't load, so Hafs is shown. */
  riwayaFailed: boolean;
  /** A full-surah recitation in the chosen riwaya, when one exists. */
  riwayaAudio: { reciter: string; src: string } | null;
}

/**
 * Shown for a riwaya other than Hafs: which one, that pages follow the Hafs mushaf, and a
 * full-surah recitation in that riwaya (per-ayah audio exists only for Hafs).
 */
function RiwayaBar({
  riwaya,
  failed,
  recitation,
  surah,
  audio,
}: {
  riwaya: { key: RiwayaKey; label: string };
  failed: boolean;
  recitation: { reciter: string; src: string } | null;
  surah: SurahRef;
  audio: ReturnType<typeof useAudio>;
}) {
  const id = `riwaya-${riwaya.key}-${surah.id}`;
  const isThis = audio.isCurrent(id);
  if (failed) {
    return (
      <p className="mb-5 rounded-2xl bg-rose/10 px-4 py-3 text-center text-sm font-bold text-rose">
        تعذّر تحميل نص رواية {riwaya.label} الآن، فنعرض لك رواية حفص. حاول بعد قليل.
      </p>
    );
  }
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-current/10 px-4 py-3 text-sm">
      <p className="inline-flex items-center gap-2">
        <BookText className="size-4 shrink-0 opacity-70" aria-hidden />
        <span>
          رواية <strong>{riwaya.label}</strong>
          <span className="opacity-70"> · ترقيم الصفحات حسب مصحف المدينة برواية حفص</span>
        </span>
      </p>
      {recitation && (
        <button
          type="button"
          onClick={() =>
            isThis
              ? audio.toggle()
              : audio.play({
                  id,
                  kind: "surah",
                  title: `سورة ${surah.name} — رواية ${riwaya.label}`,
                  subtitle: recitation.reciter,
                  src: recitation.src,
                  href: `/quran/${surah.id}?riwaya=${riwaya.key}`,
                })
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald px-4 py-2 font-bold text-white hover:bg-emerald-deep"
        >
          {isThis && audio.loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : isThis && audio.playing ? (
            <Pause className="size-4 fill-current" aria-hidden />
          ) : (
            <Play className="size-4 fill-current" aria-hidden />
          )}
          استمع للسورة بصوت {recitation.reciter}
        </button>
      )}
    </div>
  );
}

function readStoredRiwaya(): string | null {
  try {
    return window.localStorage.getItem(RIWAYA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeRiwaya(key: RiwayaKey) {
  try {
    window.localStorage.setItem(RIWAYA_STORAGE_KEY, key);
  } catch {
    // Storage unavailable: the choice still applies to this visit through the URL.
  }
}

export function MushafReader({
  surah,
  basmala,
  pages,
  tafsir,
  tajweed,
  initialMushafPage,
  previousSurah,
  nextSurah,
  riwaya,
  riwayaFailed,
  riwayaAudio,
}: MushafReaderProps) {
  const router = useRouter();
  const audio = useAudio();
  const hafs = riwaya.key === "hafs";
  const initialIndex = Math.max(
    0,
    pages.findIndex((page) => page.page === initialMushafPage),
  );
  const [index, setIndex] = useState(initialIndex);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontStep, setFontStep] = useState(2);
  const [tajweedOn, setTajweedOn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<Ayah | null>(null);
  const directionRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const coarse = useCoarsePointer();

  const page = pages[index];
  const tafsirByAyah = useMemo(() => new Map(tafsir.map((entry) => [entry.numberInSurah, entry.text])), [tafsir]);
  const tajweedByAyah = useMemo(() => new Map(tajweed.map((entry) => [entry.numberInSurah, entry.segments])), [tajweed]);
  // Tajweed colours are drawn on the Hafs text only.
  const showTajweed = tajweedOn && hafs;

  const riwayaHref = useCallback(
    (key: RiwayaKey, mushafPage: number) => {
      const params = new URLSearchParams({ page: String(mushafPage) });
      if (key !== "hafs") params.set("riwaya", key);
      return `/quran/${surah.id}?${params.toString()}` as Route;
    },
    [surah.id],
  );

  function chooseRiwaya(key: RiwayaKey, mushafPage: number) {
    storeRiwaya(key);
    setSettingsOpen(false);
    router.push(riwayaHref(key, mushafPage));
  }

  // Opening a surah without ?riwaya= keeps the riwaya chosen last time.
  const arrivalPage = pages[initialIndex]?.page;
  useEffect(() => {
    if (!hafs || arrivalPage === undefined || new URL(window.location.href).searchParams.has("riwaya")) return;
    const stored = readStoredRiwaya();
    const match = RIWAYAT.find((entry) => entry.key === stored && entry.key !== "hafs");
    if (match) router.replace(riwayaHref(match.key, arrivalPage));
  }, [hafs, arrivalPage, router, riwayaHref]);

  const go = useCallback(
    (delta: 1 | -1) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0 || next >= pages.length) return current;
        directionRef.current = delta;
        return next;
      });
    },
    [pages.length],
  );

  useEffect(() => {
    if (!page) return;
    saveLastRead({ surahId: surah.id, surahName: surah.name, page: page.page });
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page.page));
    window.history.replaceState(window.history.state, "", url);
  }, [page, surah.id, surah.name]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") go(1);
      if (event.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useGSAP(
    () => {
      const direction = directionRef.current;
      if (direction === 0) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.fromTo(
          "[data-mushaf-page]",
          { autoAlpha: 0, x: direction * -48, rotateY: direction * 9, transformOrigin: direction > 0 ? "right center" : "left center" },
          { autoAlpha: 1, x: 0, rotateY: 0, duration: 0.65, ease: "power3.out", clearProps: "transform" },
        );
      });
      mm.add(REDUCED_MOTION, () => {
        gsap.fromTo("[data-mushaf-page]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      });
      return () => mm.revert();
    },
    { scope: stageRef, dependencies: [index] },
  );

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 90) go(1);
    else if (info.offset.x < -90) go(-1);
  }

  if (!page) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-bold">تعذّر تحميل نص هذه السورة الآن.</p>
          <Link href="/quran" className="mt-4 inline-block text-emerald underline">
            العودة للفهرس
          </Link>
        </div>
      </div>
    );
  }

  const isFirstPageOfSurah = page.ayahs[0]?.numberInSurah === 1;
  const themeConfig = THEMES[theme];
  const fontSize = `clamp(1.2rem, 4.6vw, ${FONT_STEPS[fontStep]}rem)`;

  return (
    <div className={cn("min-h-dvh transition-colors duration-500", themeConfig.shell)} style={themeConfig.vars}>
      <header
        className="sticky top-0 z-30 border-b border-current/10 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--page-bg) 82%, transparent)" }}
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <Link
            href="/quran"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold opacity-80 hover:bg-current/5 hover:opacity-100"
          >
            <ArrowRight className="size-4" aria-hidden /> الفهرس
          </Link>
          <div className="mx-auto text-center leading-tight">
            <h1 className="font-display text-lg font-bold">سورة {surah.name}</h1>
            <p className="text-xs opacity-70">
              {surah.meccan ? "مكية" : "مدنية"} · صفحة {toArabicDigits(page.page)} من المصحف
              {!hafs && ` · رواية ${riwaya.short}`}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              className="grid size-10 place-items-center rounded-full hover:bg-current/5"
              aria-label="إعدادات القراءة"
            >
              {settingsOpen ? <X className="size-5" aria-hidden /> : <Settings2 className="size-5" aria-hidden />}
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="absolute left-0 top-12 w-72 rounded-3xl border border-line bg-white p-5 text-ink shadow-lift"
                >
                  <label className="block">
                    <span className="text-xs font-bold text-muted">الرواية</span>
                    <select
                      value={riwaya.key}
                      onChange={(event) => chooseRiwaya(event.target.value as RiwayaKey, page.page)}
                      className="mt-2 h-11 w-full rounded-2xl border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-emerald/50"
                    >
                      {RIWAYAT.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-5 text-xs font-bold text-muted">حجم الخط</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFontStep((step) => Math.max(0, step - 1))}
                      disabled={fontStep === 0}
                      className="grid size-9 place-items-center rounded-full border border-line"
                      aria-label="تصغير الخط"
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <div className="flex flex-1 justify-center gap-1.5" aria-hidden>
                      {FONT_STEPS.map((_, step) => (
                        <span key={step} className={cn("h-2 flex-1 rounded-full", step <= fontStep ? "bg-emerald" : "bg-line")} />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFontStep((step) => Math.min(FONT_STEPS.length - 1, step + 1))}
                      disabled={fontStep === FONT_STEPS.length - 1}
                      className="grid size-9 place-items-center rounded-full border border-line"
                      aria-label="تكبير الخط"
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-5 text-xs font-bold text-muted">لون الصفحة</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(Object.keys(THEMES) as ReaderTheme[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={theme === key}
                        onClick={() => setTheme(key)}
                        className={cn("rounded-2xl border-2 p-2 text-xs font-bold", theme === key ? "border-emerald" : "border-line")}
                        style={{
                          background: (THEMES[key].vars as Record<string, string>)["--page-bg"],
                          color: (THEMES[key].vars as Record<string, string>)["--page-ink"],
                        }}
                      >
                        {THEMES[key].label}
                      </button>
                    ))}
                  </div>
                  {tajweed.length > 0 && hafs && (
                    <button
                      type="button"
                      aria-pressed={tajweedOn}
                      onClick={() => setTajweedOn((on) => !on)}
                      className={cn(
                        "mt-5 flex w-full items-center justify-between rounded-2xl border p-3 text-sm font-bold",
                        tajweedOn ? "border-emerald bg-emerald-mist text-emerald-deep" : "border-line",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Palette className="size-4" aria-hidden /> ألوان أحكام التجويد
                      </span>
                      <span>{tajweedOn ? "مفعّل" : "متوقف"}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-3 pb-36 pt-6 sm:px-6 sm:pt-10">
        {(!hafs || riwayaFailed) && (
          <RiwayaBar riwaya={riwaya} failed={riwayaFailed} recitation={riwayaAudio} surah={surah} audio={audio} />
        )}
        <motion.div
          ref={stageRef}
          className="[perspective:1600px]"
          drag={coarse ? "x" : false}
          dragSnapToOrigin
          dragElastic={0.16}
          onDragEnd={onDragEnd}
        >
          <div data-mushaf-page>
            <MushafFrame
              headerStart={`سورة ${surah.name}`}
              headerEnd={`الجزء ${toArabicDigits(page.juz)} · ${hizbLabel(page.hizbQuarter)}`}
              page={page.page}
            >
              {isFirstPageOfSurah && (
                <>
                  <SurahBanner name={surah.name} />
                  {basmala && (
                    <p className="quran-text mb-4 text-center" style={{ fontSize }}>
                      {basmala}
                    </p>
                  )}
                </>
              )}
              <p className="quran-text text-justify [text-align-last:center]" style={{ fontSize }}>
                {page.ayahs.map((ayah) => {
                  const segments = showTajweed ? tajweedByAyah.get(ayah.numberInSurah) : undefined;
                  return (
                    <span key={ayah.number}>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(ayah)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(ayah);
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gold/15 focus-visible:bg-gold/15",
                          selected?.number === ayah.number && "bg-gold/25",
                        )}
                      >
                        {segments
                          ? segments.map((segment, segmentIndex) =>
                              segment.ruleClass ? (
                                <span key={segmentIndex} style={{ color: TAJWEED_RULES[segment.ruleClass]?.color }}>
                                  {segment.text}
                                </span>
                              ) : (
                                <span key={segmentIndex}>{segment.text}</span>
                              ),
                            )
                          : ayah.text}
                        {ayah.sajda && (
                          <span className="ayah-mark" title="موضع سجدة">
                            ۩
                          </span>
                        )}
                        <span className="ayah-mark">﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>
                      </span>{" "}
                    </span>
                  );
                })}
              </p>
            </MushafFrame>
          </div>
        </motion.div>
        {showTajweed && (
          <ul className="mt-6 flex flex-wrap justify-center gap-2 text-xs" aria-label="دليل ألوان التجويد">
            {Object.entries(TAJWEED_RULES)
              .filter(([key]) => !["slnt", "ham_wasl", "laam_shamsiyah"].includes(key))
              .map(([key, rule]) => (
                <li key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 font-bold text-ink">
                  <span className="size-2.5 rounded-full" style={{ background: rule.color }} aria-hidden /> {rule.label}
                </li>
              ))}
          </ul>
        )}
      </main>

      <nav
        aria-label="التنقل بين الصفحات"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-current/10 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--page-bg) 88%, transparent)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-bold hover:bg-current/5"
            >
              <ChevronRight className="size-5" aria-hidden /> السابقة
            </button>
          ) : previousSurah ? (
            <Link
              href={`/quran/${previousSurah.id}` as Route}
              className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-bold hover:bg-current/5"
            >
              <ChevronRight className="size-5" aria-hidden /> {previousSurah.name}
            </Link>
          ) : (
            <span className="w-24" />
          )}

          <div className="flex-1 text-center">
            <p className="text-xs font-bold opacity-75">
              صفحة {toArabicDigits(index + 1)} من {toArabicDigits(pages.length)} في السورة
            </p>
            {pages.length > 1 && (
              <input
                type="range"
                min={1}
                max={pages.length}
                value={index + 1}
                onChange={(event) => {
                  const next = Number(event.target.value) - 1;
                  directionRef.current = next > index ? 1 : -1;
                  setIndex(next);
                }}
                aria-label="انتقل إلى صفحة"
                className="mt-1 w-full max-w-xs accent-gold"
              />
            )}
          </div>

          {index < pages.length - 1 ? (
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex h-11 items-center gap-1 rounded-full bg-emerald px-5 text-sm font-bold text-white shadow-soft hover:bg-emerald-deep"
            >
              التالية <ChevronLeft className="size-5" aria-hidden />
            </button>
          ) : nextSurah ? (
            <Link
              href={`/quran/${nextSurah.id}` as Route}
              className="inline-flex h-11 items-center gap-1 rounded-full bg-emerald px-5 text-sm font-bold text-white shadow-soft hover:bg-emerald-deep"
            >
              {nextSurah.name} <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : (
            <span className="w-24" />
          )}
        </div>
      </nav>

      <AyahSheet
        surahId={surah.id}
        surahName={surah.name}
        ayah={selected}
        tafsir={selected ? tafsirByAyah.get(selected.numberInSurah) : undefined}
        onClose={() => setSelected(null)}
        canPlay={hafs}
      />
    </div>
  );
}
