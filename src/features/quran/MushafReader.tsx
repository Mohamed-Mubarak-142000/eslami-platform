"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Loader2,
  Lock,
  Palette,
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
import { MushafGlyphPage } from "./MushafGlyphPage";
import { loadGlyphFont, type GlyphPalette } from "./glyphFonts";
import {
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
import { TAJWEED_RULES } from "./tajweedApi";
import { TajweedSheet } from "./TajweedSheet";

const HIZB_PARTS = ["", "ربع ", "نصف ", "ثلاثة أرباع "];
const THEME_PREVIEW = "بِسْمِ";
/** The text shown when the printed page can't be drawn. */
const FALLBACK_TEXT_STYLE: CSSProperties = { fontSize: "clamp(19px, 4.6vw, 30px)", lineHeight: 2.25 };

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

interface MushafReaderProps {
  initialPage: MushafPageData;
  index: MushafIndex;
  /** Today's khatma or plan portion: the reader keeps to these pages and says when it's done. */
  portion?: ReaderPortion | null;
}

export interface ReaderPortion {
  from: number;
  to: number;
  kind: "khatma" | "plan";
}

const PORTION_HOME: Record<ReaderPortion["kind"], { href: Route; label: string }> = {
  khatma: { href: "/khatma", label: "الختمة" },
  plan: { href: "/plan", label: "خطة الحفظ" },
};

function pageHref(surah: number, page: number, portion?: ReaderPortion | null): Route {
  const params = new URLSearchParams({ page: String(page) });
  if (portion) {
    params.set("until", String(portion.to));
    params.set("wird", portion.kind);
  }
  return `/quran/${surah}?${params.toString()}` as Route;
}

/** In a portion: where you are in it, and — past its last page — that it's done. */
function PortionBar({ portion, current, done, onExit }: { portion: ReaderPortion; current: number; done: boolean; onExit: () => void }) {
  const total = portion.to - portion.from + 1;
  const position = Math.min(total, current - portion.from + 1);
  const home = PORTION_HOME[portion.kind];
  if (done) {
    return (
      <div className="mb-4 rounded-3xl border border-gold/50 bg-gold-mist p-5 text-center text-ink" role="status">
        <p className="text-lg font-bold text-emerald-deep">أتممت وِردك، تقبّل الله منك</p>
        <p className="mt-1 text-sm text-muted">ارجع إلى {home.label} لتسجّل أنك قرأته.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href={home.href} className="inline-flex h-10 items-center rounded-full bg-emerald px-5 text-sm font-bold text-white">
            سجّل الورد في {home.label}
          </Link>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-muted hover:bg-current/5"
          >
            تابع القراءة في المصحف
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-current/10 px-4 py-2.5 text-sm">
      <span className="shrink-0 font-bold">
        ورد اليوم: صفحة {toArabicDigits(position)} من {toArabicDigits(total)}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-current/10" aria-hidden>
        <span className="block h-full rounded-full bg-gold" style={{ width: `${(position / total) * 100}%` }} />
      </span>
      <button type="button" onClick={onExit} className="shrink-0 text-xs font-bold opacity-70 hover:opacity-100">
        المصحف كاملًا
      </button>
    </div>
  );
}

/**
 * The mushaf read as one book: pages 1–604 of Hafs 'an 'Asim, each with every surah printed on it, as
 * the King Fahd Complex's tajweed mushaf prints it. Pages load from /api/mushaf as they're turned (the
 * neighbours ahead of time).
 */
export function MushafReader({ initialPage, index, portion = null }: MushafReaderProps) {
  const router = useRouter();
  const audio = useAudio();
  const prefs = useReaderPrefs();
  const supporter = useSupporter();
  const bookmarks = useBookmarks();

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
  const [tajweedOpen, setTajweedOpen] = useState(false);
  const closeTajweed = useCallback(() => setTajweedOpen(false), []);
  const [selected, setSelected] = useState<{ ayah: MushafAyah; run: PageRun } | null>(null);
  /** Turned past the portion's last page: the "portion done" panel shows. */
  const [portionDone, setPortionDone] = useState(false);
  const firstPage = portion?.from ?? 1;
  const lastPage = portion?.to ?? TOTAL_PAGES;
  const directionRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const followedRef = useRef<number | null>(null);
  const coarse = useCoarsePointer();

  const surahNames = useMemo(() => Object.fromEntries(index.surahs.map((surah) => [surah.id, surah.name])), [index.surahs]);
  const themeKey: ReaderTheme = SUPPORTER_THEMES.includes(prefs.theme) && !supporter ? "light" : prefs.theme;
  const palette: GlyphPalette = themeKey === "night" || themeKey === "dusk" ? "dark" : themeKey === "sepia" ? "sepia" : "light";
  // The page as printed in the tajweed-coloured 1421 print. When its lines or its font can't load, the
  // page shows as text with the same tajweed colouring instead.
  const [glyphFailed, setGlyphFailed] = useState<number | null>(null);
  const glyphLines = data.glyphs?.tajweed ?? null;
  const printed = glyphLines !== null && glyphFailed !== current;
  const onGlyphFail = useCallback(() => setGlyphFailed(current), [current]);
  const ayahById = useMemo(
    () => new Map(data.runs.flatMap((run) => run.ayahs.map((ayah) => [ayah.number, { ayah, run }] as const))),
    [data],
  );
  const firstRun = data.runs[0]!;
  const bookmarked = bookmarks.some((entry) => entry.page === current);

  const load = useCallback((page: number): Promise<MushafPageData | null> => {
    const ready = cache.current.get(page);
    if (ready) return Promise.resolve(ready);
    let request = inflight.current.get(page);
    if (!request) {
      request = fetch(`/api/mushaf/${page}`)
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
  }, []);

  const goTo = useCallback(
    (page: number, direction?: 1 | -1) => {
      if (portion && page > portion.to) return setPortionDone(true);
      setPortionDone(false);
      if (page < firstPage || page > lastPage || page === current) return;
      const show = (loaded: MushafPageData) => {
        directionRef.current = direction ?? (page > current ? 1 : -1);
        setFailed(null);
        setPending(null);
        setData(loaded);
        // A page taller than the screen scrolls; each new page starts from its top.
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
    [current, load, portion, firstPage, lastPage],
  );

  // Keep the neighbours ready so turning a page is instant: their text, and their printed fonts.
  useEffect(() => {
    for (const page of [current + 1, current - 1, current + 2]) {
      if (page < firstPage || page > lastPage) continue;
      void load(page);
      void loadGlyphFont(page);
    }
  }, [current, load, firstPage, lastPage]);

  // Where you are: in the address bar (shareable, and opened again on reload) and as the last read page.
  useEffect(() => {
    saveLastRead({ surahId: firstRun.surah, surahName: firstRun.name, page: current });
    // In a portion the address keeps its first page, so a reload reopens the whole portion.
    window.history.replaceState(window.history.state, "", pageHref(firstRun.surah, portion ? portion.from : current, portion));
  }, [current, firstRun.surah, firstRun.name, portion]);

  // Follow the recitation: when it moves on from this page, turn to the page it continued on.
  const playingAyah = ayahFromTrackId(audio.track?.id);
  useEffect(() => {
    const starts = index.pageFirstAyah;
    if (!playingAyah) return;
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

  const headerEnd = `الجزء ${toArabicDigits(data.juz)} · ${hizbLabel(data.hizbQuarter)}`;
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
            </p>
          </button>
          <button
            type="button"
            onClick={() => toggleBookmark({ page: current, surahName: firstRun.name })}
            aria-pressed={bookmarked}
            className="grid size-10 place-items-center rounded-full hover:bg-current/5"
            aria-label={bookmarked ? "إزالة العلامة من هذه الصفحة" : "ضع علامة على هذه الصفحة"}
          >
            <Bookmark className={cn("size-5", bookmarked && "fill-(--page-accent) text-(--page-accent)")} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setTajweedOpen(true)}
            className="grid size-10 place-items-center rounded-full hover:bg-current/5"
            aria-label="ألوان التجويد"
          >
            <Palette className="size-5" aria-hidden />
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
                  <p className="text-xs font-bold text-muted">لون الصفحة</p>
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

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setTajweedOpen(true);
                    }}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl border border-line p-3 text-sm font-bold hover:bg-emerald-mist"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Palette className="size-4" aria-hidden /> ألوان التجويد
                    </span>
                    <ChevronLeft className="size-4 opacity-60" aria-hidden />
                  </button>
                  <p className="mt-1.5 text-[0.7rem] leading-5 text-muted">
                    مصحف التجويد الملوّن من طبعة ١٤٢١هـ، وتبدأ فيه ٢٥ صفحة بآية تختلف قليلًا عن طبعة ١٤٠٥هـ.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-3 pb-32 pt-3 sm:px-6 sm:pt-5">
        {failed !== null && (
          <p className="mb-4 flex items-center justify-center gap-3 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose">
            تعذّر تحميل الصفحة {toArabicDigits(failed)}.
            <button type="button" onClick={() => goTo(failed)} className="underline underline-offset-4">
              حاول مرة أخرى
            </button>
          </p>
        )}
        {portion && (
          <PortionBar
            portion={portion}
            current={current}
            done={portionDone}
            onExit={() => router.push(pageHref(firstRun.surah, current))}
          />
        )}
        {!printed && (
          <p className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-current/10 px-4 py-2.5 text-center text-sm">
            تعذّر تحميل الصفحة كما في المصحف المطبوع، فنعرضها نصًّا بألوان التجويد.
            {glyphLines !== null && (
              <button type="button" onClick={() => setGlyphFailed(null)} className="font-bold underline underline-offset-4">
                حاول مرة أخرى
              </button>
            )}
          </p>
        )}
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
              {printed && glyphLines && (
                <>
                  <MushafGlyphPage
                    key={`${current}-${palette}`}
                    page={current}
                    lines={glyphLines}
                    palette={palette}
                    ink={READER_THEMES[themeKey].ink}
                    selectedAyah={selected?.ayah.number ?? null}
                    playingAyah={playingAyah}
                    onSelect={(id) => {
                      const found = ayahById.get(id);
                      if (found) setSelected(found);
                    }}
                    onFail={onGlyphFail}
                  />
                  {/* The glyphs are a picture of the print; screen readers get the same page as text. */}
                  <div className="sr-only">
                    {data.runs.map((run) => (
                      <p key={run.surah}>
                        {run.opensSurah && `سورة ${run.name}. `}
                        {run.ayahs.map((ayah) => `${ayah.text} (${ayah.numberInSurah}) `).join("")}
                      </p>
                    ))}
                  </div>
                </>
              )}
              {/* The page's font or lines couldn't load: the same page as text, with the tajweed colouring. */}
              {!printed &&
                data.runs.map((run) => (
                  <section key={run.surah} aria-label={`سورة ${run.name}`}>
                    {run.opensSurah && (
                      <>
                        <SurahBanner name={run.name} />
                        {run.basmala && (
                          <p className="quran-text mb-1 text-center" style={FALLBACK_TEXT_STYLE}>
                            {run.basmala}
                          </p>
                        )}
                      </>
                    )}
                    <p className="quran-text text-justify [text-align-last:center]" style={FALLBACK_TEXT_STYLE}>
                      {run.ayahs.map((ayah) => {
                        const segments = ayah.tajweed;
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
                              <AyahNumber number={ayah.numberInSurah} />
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
        {current === TOTAL_PAGES && (
          <Link
            href="/khatm-dua"
            className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-bold text-emerald-night shadow-gold hover:bg-gold-soft"
          >
            <HandHeart className="size-5" aria-hidden /> دعاء ختم القرآن
          </Link>
        )}
      </main>

      <nav
        aria-label="التنقل بين الصفحات"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-current/10 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--page-bg) 88%, transparent)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => goTo(current - 1, -1)}
            disabled={current === firstPage}
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
              {portion
                ? `صفحة ${toArabicDigits(shownSlider - portion.from + 1)} من ${toArabicDigits(portion.to - portion.from + 1)} من وردك`
                : `صفحة ${toArabicDigits(shownSlider)} من ٦٠٤ · انتقل`}
            </button>
            <input
              type="range"
              min={firstPage}
              max={lastPage}
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
            disabled={current === TOTAL_PAGES || portionDone}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-emerald px-4 text-sm font-bold text-white shadow-soft hover:bg-emerald-deep disabled:opacity-40 sm:px-5"
          >
            {portion && current === portion.to ? "أتممت الورد" : "التالية"} <ChevronLeft className="size-5" aria-hidden />
          </button>
        </div>
      </nav>

      <JumpSheet
        open={jumpOpen}
        index={index}
        currentPage={current}
        bookmarks={bookmarks}
        onJump={(page) => goTo(page)}
        onClose={() => setJumpOpen(false)}
      />

      <AyahSheet
        surahId={selected?.run.surah ?? firstRun.surah}
        surahName={selected?.run.name ?? firstRun.name}
        ayah={selected?.ayah ?? null}
        tafsir={selected?.ayah.tafsir ?? undefined}
        onClose={() => setSelected(null)}
        surahNames={surahNames}
      />

      <TajweedSheet open={tajweedOpen} dark={palette === "dark"} onClose={closeTajweed} />
    </div>
  );
}
