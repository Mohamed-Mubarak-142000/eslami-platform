"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { BASMALA } from "./textApi";
import { loadGlyphFont, type GlyphPalette } from "./glyphFonts";
import type { MushafLine } from "./mushafPageTypes";

/** A printed line's height, in units of the glyph size. */
const LINE_HEIGHT = 1.8;
/** Below this share of the page's widest line, a line is set centred (a surah's last line, pages 1–2). */
const CENTRE_BELOW = 0.8;
const MIN_SIZE = 14;
/** The page never shrinks below this to fit a short screen; it scrolls instead. */
const READABLE_SIZE = 22;
/**
 * The tajweed font's CPAL palettes: 0 for light pages, 1 for dark ones. Entries 0, 13 and 14 are the
 * plain text, which takes the page's own ink so it matches the rest of the reader.
 */
const DARK_PALETTE = 1;
const INK_ENTRIES = [0, 13, 14];

interface MushafGlyphPageProps {
  page: number;
  lines: MushafLine[];
  palette: GlyphPalette;
  /** The page's text colour. */
  ink: string;
  /** Global ayah numbers to tint: the one chosen, and the one being recited. */
  selectedAyah: number | null;
  playingAyah: number | null;
  onSelect: (ayah: number) => void;
  /** Called when the font can't load, so the reader falls back to the text. */
  onFail: () => void;
}

/** A surah's title on its own printed line, sized with the glyphs (the reader's banner, drawn in em). */
function SurahTitle({ name }: { name: string }) {
  return (
    <div className="relative flex w-full max-w-[16em] items-center justify-center" style={{ height: "calc(var(--glyph-size) * 1.45)" }}>
      <svg viewBox="0 0 400 64" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <path d="M24 4h352l20 28-20 28H24L4 32z" fill="var(--color-emerald)" stroke="var(--color-gold)" strokeWidth="3" />
        <path d="M34 11h332l14 21-14 21H34L20 32z" fill="none" stroke="var(--color-gold)" strokeOpacity="0.6" strokeWidth="1.5" />
      </svg>
      <span className="relative font-quran leading-none text-white" style={{ fontSize: "calc(var(--glyph-size) * 0.78)" }}>
        سورة {name}
      </span>
    </div>
  );
}

/**
 * One page exactly as the Madinah mushaf prints it: each word a glyph of the page's own font, on its
 * own line. The glyph size is set from the page's widest line so it fills the width, or less when
 * the height is shorter; lines narrower than the rest are centred, as in print.
 */
export function MushafGlyphPage({ page, lines, palette, ink, selectedAyah, playingAyah, onSelect, onFail }: MushafGlyphPageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  // The family the page's font loaded under, once it has loaded.
  const [family, setFamily] = useState<string | null>(null);
  const ready = family !== null;
  const paletteName = family ? `--${family}-ink` : null;
  const paletteRule = paletteName
    ? `@font-palette-values ${paletteName} { font-family: "${family}"; base-palette: ${palette === "dark" ? DARK_PALETTE : 0}; override-colors: ${INK_ENTRIES.map((entry) => `${entry} ${ink}`).join(", ")}; }`
    : null;
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadGlyphFont(page).then((loaded) => {
      if (cancelled) return;
      if (loaded) setFamily(loaded);
      else onFail();
    });
    return () => {
      cancelled = true;
    };
  }, [page, onFail]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !ready) return;
    const fit = () => {
      const rows = Array.from(box.querySelectorAll<HTMLElement>("[data-glyph-line]"));
      const natural = (row: HTMLElement) => Array.from(row.children).reduce((sum, child) => sum + child.getBoundingClientRect().width, 0);
      // Measure at a known size, then scale: glyph widths grow linearly with the size.
      box.style.maxWidth = "";
      box.style.setProperty("--glyph-size", "40px");
      const widths = rows.map(natural);
      const widest = Math.max(...widths, 1);
      const byWidth = (40 * box.clientWidth) / widest;
      // The whole page above the bottom bar, as on a phone held upright — but never too small to read.
      const room = window.innerHeight - box.getBoundingClientRect().top - 150;
      const byHeight = Math.max(READABLE_SIZE, room / (lines.length * LINE_HEIGHT));
      const size = Math.max(MIN_SIZE, Math.min(byWidth, byHeight));
      box.style.setProperty("--glyph-size", `${size.toFixed(2)}px`);
      // A page held back by the height keeps the print's proportions: as wide as its widest line.
      if (size < byWidth) box.style.maxWidth = `${((widest * size) / 40 + 2).toFixed(0)}px`;
      rows.forEach((row, index) => {
        const centred = page <= 2 || widths[index]! / widest < CENTRE_BELOW;
        row.style.justifyContent = centred ? "center" : "space-between";
        row.style.gap = centred ? "0.18em" : "0";
      });
      setFitted(true);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [ready, lines, page]);

  const lineStyle: CSSProperties = { height: `calc(var(--glyph-size) * ${LINE_HEIGHT})` };

  return (
    <div
      ref={boxRef}
      aria-hidden
      dir="rtl"
      // Hidden (not faded) until laid out: an opacity fade puts the page on its own compositing layer.
      className={cn("mx-auto", !(ready && fitted) && "invisible")}
      style={{ "--glyph-size": "24px", fontSize: "var(--glyph-size)" } as CSSProperties}
    >
      {paletteRule && <style>{paletteRule}</style>}
      {lines.map((line, index) => {
        if (line.kind === "surah") {
          return (
            <div key={index} className="flex items-center justify-center" style={lineStyle}>
              <SurahTitle name={line.name} />
            </div>
          );
        }
        if (line.kind === "basmala") {
          return (
            <p
              key={index}
              className="quran-text flex items-center justify-center"
              style={{ ...lineStyle, fontSize: "calc(var(--glyph-size) * 0.92)" }}
            >
              {BASMALA}
            </p>
          );
        }
        return (
          <div key={index} className="flex items-center" style={lineStyle}>
            {/*
             * The words go in only once their font has loaded, so they are first painted in it. iPhone's
             * WebKit didn't repaint words already on screen when their FontFace font arrived inside the
             * reader's draggable, page-turning stage, and the page stayed blank.
             */}
            {family && (
              <div
                data-glyph-line
                className="flex w-full items-center"
                style={{
                  fontFamily: family,
                  fontSize: "var(--glyph-size)",
                  lineHeight: 1,
                  ...(paletteName && { fontPalette: paletteName }),
                }}
              >
                {line.words.map((word, wordIndex) => {
                  const tint = word.ayah === playingAyah ? "playing" : word.ayah === selectedAyah ? "selected" : null;
                  return (
                    <span
                      key={wordIndex}
                      onClick={() => onSelect(word.ayah)}
                      className={cn(
                        "cursor-pointer whitespace-nowrap rounded-md px-[0.02em] transition-colors duration-300 hover:bg-gold/15",
                        tint === "playing" && "bg-[color-mix(in_srgb,var(--page-accent)_18%,transparent)]",
                        tint === "selected" && "bg-gold/25",
                      )}
                    >
                      {word.code}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
