"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Minus,
  Palette,
  Pause,
  Play,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { useAudio } from "@/features/audio/AudioProvider";
import { openSupportSheet } from "@/features/support/support-store";
import { useSupporter } from "@/features/support/useSupporter";
import { gsap, useGSAP, FULL_MOTION, REDUCED_MOTION } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useCoarsePointer } from "@/lib/useCoarsePointer";
import { AyahNumber } from "./AyahNumber";
import { AyahSheet } from "./AyahSheet";
import { JumpSheet } from "./JumpSheet";
import { MushafFrame, SurahBanner } from "./MushafFrame";
import { saveLastRead } from "./lastReadStorage";
import { TOTAL_PAGES, type MushafAyah, type MushafIndex, type MushafPageData, type PageRun } from "./mushafPageTypes";
import {
  DEFAULT_FONT_STEP,
  FONT_STEPS,
  READER_THEMES,
  SUPPORTER_THEMES,
  setReaderPrefs,
  themeStyle,
  toggleBookmark,
  useBookmarks,
  useReaderPrefs,
  type ReaderTheme,
} from "./readerPrefs";
import { ayahFromTrackId } from "./recitation";
import { RIWAYAT, RIWAYA_STORAGE_KEY, type RiwayaKey } from "./riwayat";
import { TAJWEED_RULES } from "./tajweedApi";

const HIZB_PARTS = ["", "ربع ", "نصف ", "ثلاثة أرباع "];
/** The smallest size a page shrinks to so it shows whole. */
const MIN_FIT_PX = 15;
/** Line spacing to try, roomiest first, when a page doesn't fit at the smallest size. */
const LEADINGS = [2.25, 2.05, 1.9] as const;
const THEME_PREVIEW = "بِسْمِ";
const SIZE_PREVIEW = "ٱلْحَمْدُ لِلَّهِ";

function hizbLabel(hizbQuarter: number): string {
  const hizb = Math.ceil(hizbQuarter / 4);
  const part = (hizbQuarter - 1) % 4;
  return `${HIZB_PARTS[part] ?? ""}الحزب ${toArabicDigits(hizb)}`;
}

/** The page a global ayah number is on: the last page starting at or before it. */
function pageOfAyah(pageFirstAyah: number[], ayah: number): number {
  let low = 0;
  let high = pageFirstAyah.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (pageFirstAyah[mid]! <= ayah) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

/** The tajweed legend, one chip per colour (several rules share one). */
const TAJWEED_LEGEND = Object.values(
  Object.fromEntries(
    Object.entries(TAJWEED_RULES)
      .filter(([key]) => !["slnt", "ham_wasl", "laam_shamsiyah"].includes(key))
      .map(([, rule]) => [rule.color, rule]),
  ),
);

interface MushafReaderProps {
  initialPage: MushafPageData;
  index: MushafIndex;
  /** The riwaya actually shown: Hafs when the chosen one failed to load. */
  riwaya: { key: RiwayaKey; label: string; short: string };
  /** The chosen riwaya's text couldn't load, so Hafs is shown. */
  riwayaFailed: boolean;
  failedRiwayaLabel: string;
  /** The typeface of the riwaya's own mushaf; null for Hafs. */
  riwayaFont: string | null;
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

function pageHref(surah: number, page: number, riwaya: RiwayaKey): Route {
  const params = new URLSearchParams({ page: String(page) });
  if (riwaya !== "hafs") params.set("riwaya", riwaya);
  return `/quran/${surah}?${params.toString()}` as Route;
}

/** Another riwaya: its name, and a full-surah recitation of the page's first surah in it. */
function RiwayaBar({
  riwaya,
  data,
  audio,
}: {
  riwaya: { key: RiwayaKey; label: string };
  data: MushafPageData;
  audio: ReturnType<typeof useAudio>;
}) {
  const recitation = data.recitation;
  const run = data.runs.find((entry) => entry.surah === recitation?.surah);
  const id = recitation ? `riwaya-${riwaya.key}-${recitation.surah}` : "";
  const isThis = recitation ? audio.isCurrent(id) : false;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-current/10 px-4 py-3 text-sm">
      <p className="inline-flex items-center gap-2">
        <BookText className="size-4 shrink-0 opacity-70" aria-hidden />
        <span>
          مصحف رواية <strong>{riwaya.label}</strong>
          <span className="opacity-70"> · برسمه وترقيم آياته وصفحاته كما طبعه مجمع الملك فهد</span>
        </span>
      </p>
      {recitation && run && (
        <button
          type="button"
          onClick={() =>
            isThis
              ? audio.toggle()
              : audio.play({
                  id,
                  kind: "surah",
                  title: `سورة ${run.name} — رواية ${riwaya.label}`,
                  subtitle: recitation.reciter,
                  src: recitation.src,
                  href: pageHref(run.surah, data.page, riwaya.key),
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
          سورة {run.name} بصوت {recitation.reciter}
        </button>
      )}
    </div>
  );
}

/**
 * The mushaf read as one book: pages 1–604 of the chosen riwaya, each with every surah printed on it.
 * Pages load from /api/mushaf as they're turned (the neighbours ahead of time). At the normal text size
 * and below, a page shrinks to show whole on the screen, like a printed page.
 */
export function MushafReader({ initialPage, index, riwaya, riwayaFailed, failedRiwayaLabel, riwayaFont }: MushafReaderProps) {
  const router = useRouter();
  const audio = useAudio();
  const prefs = useReaderPrefs();
  const supporter = useSupporter();
  const bookmarks = useBookmarks();
  const hafs = riwaya.key === "hafs";

  const cache = useRef(new Map<number, MushafPageData>([[initialPage.page, initialPage]]));
  const inflight = useRef(new Map<number, Promise<MushafPageData | null>>());
  // The page on screen; the cache above only feeds it, from event handlers and effects.
  const [data, setData] = useState(initialPage);
  const current = data.page;
  const [pending, setPending] = useState<number | null>(null);
  const [failed, setFailed] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [selected, setSelected] = useState<{ ayah: MushafAyah; run: PageRun } | null>(null);
  const directionRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const followedRef = useRef<number | null>(null);
  const coarse = useCoarsePointer();

  const surahNames = useMemo(() => Object.fromEntries(index.surahs.map((surah) => [surah.id, surah.name])), [index.surahs]);
  const themeKey: ReaderTheme = SUPPORTER_THEMES.includes(prefs.theme) && !supporter ? "light" : prefs.theme;
  const showTajweed = prefs.tajweed && hafs;
  const firstRun = data.runs[0]!;
  const bookmarked = bookmarks.some((entry) => entry.riwaya === riwaya.key && entry.page === current);

  const load = useCallback(
    (page: number): Promise<MushafPageData | null> => {
      const ready = cache.current.get(page);
      if (ready) return Promise.resolve(ready);
      let request = inflight.current.get(page);
      if (!request) {
        request = fetch(`/api/mushaf/${page}?riwaya=${riwaya.key}`)
          .then((response) => (response.ok ? (response.json() as Promise<MushafPageData>) : null))
          .then((loaded) => {
            if (loaded) cache.current.set(page, loaded);
            return loaded;
          })
          .catch(() => null)
          .finally(() => inflight.current.delete(page));
        inflight.current.set(page, request);
      }
      return request;
    },
    [riwaya.key],
  );

  const goTo = useCallback(
    (page: number, direction?: 1 | -1) => {
      if (page < 1 || page > TOTAL_PAGES || page === current) return;
      const show = (loaded: MushafPageData) => {
        directionRef.current = direction ?? (page > current ? 1 : -1);
        setFailed(null);
        setPending(null);
        setData(loaded);
        // A larger text size scrolls; each new page starts from its top.
        window.scrollTo({ top: 0 });
      };
      const ready = cache.current.get(page);
      if (ready) return show(ready);
      setPending(page);
      void load(page).then((loaded) => {
        if (loaded) show(loaded);
        else {
          setPending(null);
          setFailed(page);
        }
      });
    },
    [current, load],
  );

  // Keep the neighbours ready so turning a page is instant.
  useEffect(() => {
    for (const page of [current + 1, current - 1, current + 2]) if (page >= 1 && page <= TOTAL_PAGES) void load(page);
  }, [current, load]);

  // Where you are: in the address bar (shareable, and opened again on reload) and as the last read page.
  useEffect(() => {
    saveLastRead({ surahId: firstRun.surah, surahName: firstRun.name, page: current });
    window.history.replaceState(window.history.state, "", pageHref(firstRun.surah, current, riwaya.key));
  }, [current, firstRun.surah, firstRun.name, riwaya.key]);

  // Opening the mushaf without ?riwaya= keeps the riwaya chosen last time.
  useEffect(() => {
    if (!hafs || new URL(window.location.href).searchParams.has("riwaya")) return;
    const stored = readStoredRiwaya();
    const match = RIWAYAT.find((entry) => entry.key === stored && entry.key !== "hafs");
    if (match) router.replace(pageHref(initialPage.runs[0]!.surah, initialPage.page, match.key));
  }, [hafs, router, initialPage]);

  function chooseRiwaya(key: RiwayaKey) {
    storeRiwaya(key);
    setSettingsOpen(false);
    router.push(pageHref(firstRun.surah, current, key));
  }

  // Follow the recitation: when it moves on from this page, turn to the page it continued on.
  const playingAyah = hafs ? ayahFromTrackId(audio.track?.id) : null;
  useEffect(() => {
    const starts = index.pageFirstAyah;
    if (!playingAyah || !starts) return;
    const previous = followedRef.current;
    followedRef.current = playingAyah;
    if (previous === null || previous === playingAyah) return;
    const target = pageOfAyah(starts, playingAyah);
    if (target !== current && pageOfAyah(starts, previous) === current) goTo(target, 1);
  }, [playingAyah, index.pageFirstAyah, current, goTo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") goTo(current + 1, 1);
      if (event.key === "ArrowRight") goTo(current - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  // At the normal size and below, shrink the text (then tighten the lines a little) until the whole
  // page ends above the bottom bar. Larger sizes keep their size and scroll.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const target = Math.round(Math.max(19, Math.min(window.innerWidth * 0.046, FONT_STEPS[prefs.fontStep] ?? 30)));
      const apply = (size: number, leading: number) => {
        stage.style.setProperty("--quran-size", `${size}px`);
        stage.style.setProperty("--quran-leading", String(leading));
      };
      apply(target, LEADINGS[0]);
      if (prefs.fontStep > DEFAULT_FONT_STEP) return;
      const limit = window.innerHeight - (navRef.current?.offsetHeight ?? 88) - 10;
      const fits = () => stage.getBoundingClientRect().top + window.scrollY + stage.offsetHeight <= limit;
      for (const leading of LEADINGS) {
        let size = target;
        apply(size, leading);
        while (!fits() && size > MIN_FIT_PX) apply(--size, leading);
        if (fits()) return;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    void document.fonts?.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, [current, prefs.fontStep, showTajweed, riwayaFont]);

  useGSAP(
    () => {
      const direction = directionRef.current;
      if (direction === 0) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.fromTo(
          "[data-mushaf-page]",
          { autoAlpha: 0, x: direction * -48, rotateY: direction * 9, transformOrigin: direction > 0 ? "right center" : "left center" },
          { autoAlpha: 1, x: 0, rotateY: 0, duration: 0.6, ease: "power3.out", clearProps: "transform" },
        );
      });
      mm.add(REDUCED_MOTION, () => {
        gsap.fromTo("[data-mushaf-page]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      });
      return () => mm.revert();
    },
    { scope: stageRef, dependencies: [current] },
  );

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 90) goTo(current + 1, 1);
    else if (info.offset.x < -90) goTo(current - 1, -1);
  }

  function pickTheme(key: ReaderTheme) {
    if (SUPPORTER_THEMES.includes(key) && !supporter) {
      setSettingsOpen(false);
      openSupportSheet();
      return;
    }
    setReaderPrefs({ theme: key });
  }

  const textStyle: CSSProperties = {
    fontSize: "var(--quran-size, 1.9rem)",
    lineHeight: "var(--quran-leading, 2.25)",
    ...(riwayaFont && { fontFamily: riwayaFont }),
  };
  const headerEnd =
    data.hizbQuarter === null ? `الجزء ${toArabicDigits(data.juz)}` : `الجزء ${toArabicDigits(data.juz)} · ${hizbLabel(data.hizbQuarter)}`;
  const shownSlider = sliderValue ?? current;

  return (
    <div className="min-h-dvh overflow-x-clip transition-colors duration-500" style={themeStyle(themeKey)}>
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-current/10 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--page-bg) 82%, transparent)" }}
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-2 px-3 sm:px-4">
          <Link
            href="/quran"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold opacity-80 hover:bg-current/5 hover:opacity-100"
          >
            <ArrowRight className="size-4" aria-hidden /> <span className="hidden sm:inline">الفهرس</span>
          </Link>
          <button
            type="button"
            onClick={() => setJumpOpen(true)}
            className="mx-auto rounded-2xl px-3 py-1 text-center leading-tight hover:bg-current/5"
            aria-label="انتقل إلى سورة أو جزء أو صفحة"
          >
            <h1 className="inline-flex items-center gap-1 font-display text-lg font-bold">
              سورة {firstRun.name}
              <ChevronDown className="size-4 opacity-60" aria-hidden />
            </h1>
            <p className="text-xs opacity-70">
              <span className="hidden sm:inline">
                {headerEnd} · صفحة {toArabicDigits(current)} من ٦٠٤
              </span>
              <span className="sm:hidden">
                الجزء {toArabicDigits(data.juz)} · صفحة {toArabicDigits(current)}
              </span>
              {!hafs && ` · ${riwaya.short}`}
            </p>
          </button>
          <button
            type="button"
            onClick={() => toggleBookmark({ riwaya: riwaya.key, page: current, surahName: firstRun.name })}
            aria-pressed={bookmarked}
            className="grid size-10 place-items-center rounded-full hover:bg-current/5"
            aria-label={bookmarked ? "إزالة العلامة من هذه الصفحة" : "ضع علامة على هذه الصفحة"}
          >
            <Bookmark className={cn("size-5", bookmarked && "fill-(--page-accent) text-(--page-accent)")} aria-hidden />
          </button>
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
                  className="absolute left-0 top-12 max-h-[calc(100dvh-5rem)] w-80 overflow-y-auto rounded-3xl border border-line bg-white p-5 text-ink shadow-lift"
                >
                  <label className="block">
                    <span className="text-xs font-bold text-muted">الرواية</span>
                    <select
                      value={riwaya.key}
                      onChange={(event) => chooseRiwaya(event.target.value as RiwayaKey)}
                      className="mt-2 h-11 w-full rounded-2xl border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-emerald/50"
                    >
                      {RIWAYAT.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="mt-5 text-xs font-bold text-muted">لون الصفحة</p>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {(Object.keys(READER_THEMES) as ReaderTheme[]).map((key) => {
                      const colors = READER_THEMES[key];
                      const locked = SUPPORTER_THEMES.includes(key) && !supporter;
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={themeKey === key}
                          onClick={() => pickTheme(key)}
                          title={locked ? `${colors.label} — للداعمين` : colors.label}
                          className={cn(
                            "relative flex flex-col items-center gap-0.5 rounded-2xl border-2 px-1 pb-1 pt-1.5",
                            themeKey === key ? "border-emerald" : "border-line",
                          )}
                          style={{ background: colors.page, color: colors.ink }}
                        >
                          <span className="quran-text text-lg leading-8">{THEME_PREVIEW}</span>
                          <span className="text-[0.65rem] font-bold" style={{ color: colors.accent }}>
                            {colors.label}
                          </span>
                          {locked && (
                            <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-emerald-night shadow-soft">
                              <Lock className="size-3" aria-hidden />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!supporter && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        openSupportSheet();
                      }}
                      className="mt-2 text-xs font-bold text-gold-deep underline-offset-4 hover:underline"
                    >
                      لونا «زمردي» و«غسقي» لداعمي المنارة
                    </button>
                  )}

                  <p className="mt-5 text-xs font-bold text-muted">حجم الخط</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReaderPrefs({ fontStep: Math.max(0, prefs.fontStep - 1) })}
                      disabled={prefs.fontStep === 0}
                      className="grid size-9 place-items-center rounded-full border border-line disabled:opacity-40"
                      aria-label="تصغير الخط"
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <p
                      className="quran-text flex-1 truncate rounded-2xl bg-ivory px-2 text-center leading-[1.8]"
                      style={{ fontSize: Math.min(FONT_STEPS[prefs.fontStep] ?? 30, 34) }}
                      aria-hidden
                    >
                      {SIZE_PREVIEW}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReaderPrefs({ fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) })}
                      disabled={prefs.fontStep === FONT_STEPS.length - 1}
                      className="grid size-9 place-items-center rounded-full border border-line disabled:opacity-40"
                      aria-label="تكبير الخط"
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[0.7rem] leading-5 text-muted">
                    {prefs.fontStep <= DEFAULT_FONT_STEP ? "تظهر الصفحة كاملة على الشاشة." : "الخط الأكبر قد يحتاج إلى التمرير."}
                  </p>

                  {hafs && (
                    <>
                      <button
                        type="button"
                        aria-pressed={prefs.tajweed}
                        onClick={() => setReaderPrefs({ tajweed: !prefs.tajweed })}
                        className={cn(
                          "mt-5 flex w-full items-center justify-between rounded-2xl border p-3 text-sm font-bold",
                          prefs.tajweed ? "border-emerald bg-emerald-mist text-emerald-deep" : "border-line",
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Palette className="size-4" aria-hidden /> ألوان أحكام التجويد
                        </span>
                        <span>{prefs.tajweed ? "مفعّل" : "متوقف"}</span>
                      </button>
                      {prefs.tajweed && (
                        <ul className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem]" aria-label="دليل ألوان التجويد">
                          {TAJWEED_LEGEND.map((rule) => (
                            <li key={rule.color} className="inline-flex items-center gap-1 rounded-full bg-ivory px-2 py-0.5 font-bold">
                              <span className="size-2.5 rounded-full" style={{ background: rule.color }} aria-hidden /> {rule.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-3 pb-32 pt-3 sm:px-6 sm:pt-5">
        {riwayaFailed && (
          <p className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-center text-sm font-bold text-rose">
            تعذّر تحميل مصحف رواية {failedRiwayaLabel} الآن، فنعرض لك رواية حفص. حاول بعد قليل.
          </p>
        )}
        {failed !== null && (
          <p className="mb-4 flex items-center justify-center gap-3 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose">
            تعذّر تحميل الصفحة {toArabicDigits(failed)}.
            <button type="button" onClick={() => goTo(failed)} className="underline underline-offset-4">
              حاول مرة أخرى
            </button>
          </p>
        )}
        {!hafs && <RiwayaBar riwaya={riwaya} data={data} audio={audio} />}
        <motion.div
          ref={stageRef}
          className={cn("relative transition-opacity perspective-[1600px]", pending !== null && "opacity-60")}
          // A swipe turns the page, but the page itself stays still: no sliding or wobbling while reading.
          drag={coarse ? "x" : false}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          {pending !== null && (
            <Loader2
              className="absolute left-1/2 top-1/2 z-10 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin"
              aria-label="جارٍ التحميل"
            />
          )}
          <div data-mushaf-page>
            <MushafFrame headerStart={`سورة ${firstRun.name}`} headerEnd={headerEnd} page={current}>
              {data.runs.map((run) => (
                <section key={run.surah} aria-label={`سورة ${run.name}`}>
                  {run.opensSurah && (
                    <>
                      <SurahBanner name={run.name} />
                      {run.basmala && (
                        <p className="quran-text mb-1 text-center" style={textStyle}>
                          {run.basmala}
                        </p>
                      )}
                    </>
                  )}
                  <p className="quran-text text-justify [text-align-last:center]" style={textStyle}>
                    {run.ayahs.map((ayah) => {
                      const segments = showTajweed ? ayah.tajweed : null;
                      const reciting = playingAyah === ayah.number;
                      return (
                        <span key={ayah.number}>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelected({ ayah, run })}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelected({ ayah, run });
                              }
                            }}
                            className={cn(
                              "cursor-pointer rounded-lg transition-colors duration-300 hover:bg-gold/15 focus-visible:bg-gold/15",
                              reciting && "bg-[color-mix(in_srgb,var(--page-accent)_18%,transparent)]",
                              selected?.ayah.number === ayah.number && "bg-gold/25",
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
                            <AyahNumber number={ayah.numberInSurah} riwayaFont={riwayaFont} />
                          </span>{" "}
                        </span>
                      );
                    })}
                  </p>
                </section>
              ))}
            </MushafFrame>
          </div>
        </motion.div>
      </main>

      <nav
        ref={navRef}
        aria-label="التنقل بين الصفحات"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-current/10 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--page-bg) 88%, transparent)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => goTo(current - 1, -1)}
            disabled={current === 1}
            className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-bold hover:bg-current/5 disabled:opacity-30 sm:px-4"
          >
            <ChevronRight className="size-5" aria-hidden /> السابقة
          </button>

          <div className="flex-1 text-center">
            <button
              type="button"
              onClick={() => setJumpOpen(true)}
              className="rounded-full px-3 py-0.5 text-xs font-bold opacity-80 hover:bg-current/5 hover:opacity-100"
            >
              صفحة {toArabicDigits(shownSlider)} من ٦٠٤ · انتقل
            </button>
            <input
              type="range"
              min={1}
              max={TOTAL_PAGES}
              value={shownSlider}
              onChange={(event) => setSliderValue(Number(event.target.value))}
              onPointerUp={() => {
                if (sliderValue !== null) goTo(sliderValue);
                setSliderValue(null);
              }}
              onKeyUp={() => {
                if (sliderValue !== null) goTo(sliderValue);
                setSliderValue(null);
              }}
              aria-label="انتقل إلى صفحة"
              className="mt-0.5 block w-full accent-gold"
              dir="rtl"
            />
          </div>

          <button
            type="button"
            onClick={() => goTo(current + 1, 1)}
            disabled={current === TOTAL_PAGES}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-emerald px-4 text-sm font-bold text-white shadow-soft hover:bg-emerald-deep disabled:opacity-40 sm:px-5"
          >
            التالية <ChevronLeft className="size-5" aria-hidden />
          </button>
        </div>
      </nav>

      <JumpSheet
        open={jumpOpen}
        index={index}
        currentPage={current}
        bookmarks={bookmarks.filter((entry) => entry.riwaya === riwaya.key)}
        onJump={(page) => goTo(page)}
        onClose={() => setJumpOpen(false)}
      />

      <AyahSheet
        surahId={selected?.run.surah ?? firstRun.surah}
        surahName={selected?.run.name ?? firstRun.name}
        ayah={selected?.ayah ?? null}
        tafsir={selected?.ayah.tafsir ?? undefined}
        onClose={() => setSelected(null)}
        hafs={hafs}
        riwayaFont={riwayaFont}
        surahNames={surahNames}
      />
    </div>
  );
}
