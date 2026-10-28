"use client";

import { useEffect, useState } from "react";

/*
 * Temporary diagnostic: which way of loading the King Fahd Complex page fonts draws on this device.
 * Built to find why the printed mushaf shows blank on iPhone; remove once fixed.
 */

const V1 = "ﭖ ﭗ ﭘ ﭙ ﭚ";
const V2 = "ﱆ ﱇ ﱈ ﱉ ﱊ";

interface Variant {
  id: string;
  label: string;
  codes: string;
  /** Load through the FontFace API (with this source), or through a CSS @font-face rule. */
  how: "api" | "css";
  src: string;
}

const VARIANTS: Variant[] = [
  {
    id: "ft-a",
    label: "أ: V1 woff2 بـ FontFace (الطريقة الحالية)",
    codes: V1,
    how: "api",
    src: `url("https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p1.woff2") format("woff2")`,
  },
  {
    id: "ft-b",
    label: "ب: V1 ttf بـ FontFace",
    codes: V1,
    how: "api",
    src: `url("https://static.qurancdn.com/fonts/quran/hafs/v1/ttf/p1.ttf") format("truetype")`,
  },
  {
    id: "ft-c",
    label: "ج: V1 بـ CSS @font-face (woff2 ثم ttf)",
    codes: V1,
    how: "css",
    src: `url("https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p1.woff2") format("woff2"), url("https://static.qurancdn.com/fonts/quran/hafs/v1/ttf/p1.ttf") format("truetype")`,
  },
  {
    id: "ft-d",
    label: "د: V2 woff2 بـ FontFace",
    codes: V2,
    how: "api",
    src: `url("https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p1.woff2") format("woff2")`,
  },
  {
    id: "ft-e",
    label: "هـ: V2 بـ CSS @font-face",
    codes: V2,
    how: "css",
    src: `url("https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p1.woff2") format("woff2")`,
  },
  {
    id: "ft-f",
    label: "و: تجويد COLRv1 بـ FontFace",
    codes: V2,
    how: "api",
    src: `url("https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p1.woff2") format("woff2")`,
  },
  {
    id: "ft-g",
    label: "ز: تجويد OT-SVG بـ FontFace",
    codes: V2,
    how: "api",
    src: `url("https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/light/woff2/p1.woff2") format("woff2")`,
  },
];

function inkOnCanvas(family: string, text: string): boolean | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 80;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.font = `48px "${family}"`;
    context.fillText(text, 10, 55);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 3; index < data.length; index += 4) if (data[index]! > 0) return true;
    return false;
  } catch {
    return null;
  }
}

const V1_P2 = `url("https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p2.woff2") format("woff2")`;
const V1_P2_CODES = "ﭑ ﭒ ﭓ ﭔ ﭕ";

/**
 * The reader's own conditions: words inside a transformed (dragged, page-turning) stage. "Before"
 * puts the words on screen first and the font arrives after, as the reader did; "after" adds the
 * words only once their font has loaded, as it does now.
 */
function StageTest({ when }: { when: "before" | "after" }) {
  const family = `ft-stage-${when}`;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void new FontFace(family, V1_P2, { display: "block" }).load().then((face) => {
        document.fonts.add(face);
        setLoaded(true);
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [family]);
  const show = when === "before" || loaded;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm font-bold">
        {when === "before"
          ? "ح: داخل صفحة المصحف — الكلمات قبل الخط (الطريقة القديمة)"
          : "ط: داخل صفحة المصحف — الخط قبل الكلمات (الإصلاح)"}
      </p>
      <div style={{ perspective: 1600 }}>
        <div style={{ transform: "translateZ(0)", willChange: "transform" }}>
          {show && (
            <div className="mt-2 flex w-full items-center justify-between" style={{ fontFamily: family, fontSize: 30, lineHeight: 1 }}>
              {V1_P2_CODES.split(" ").map((code, index) => (
                <span key={index} className="whitespace-nowrap">
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted" dir="ltr">
        {loaded ? "font loaded" : "loading…"}
      </p>
    </div>
  );
}

export function FontTest() {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [agent, setAgent] = useState("");

  useEffect(() => {
    // A throwaway diagnostic: reading the device once on mount is all it needs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgent(navigator.userAgent);
    for (const variant of VARIANTS) {
      const done = (loaded: string) => {
        const fits = document.fonts.check(`20px "${variant.id}"`, variant.codes);
        const ink = inkOnCanvas(variant.id, variant.codes);
        setStatus((current) => ({ ...current, [variant.id]: `${loaded} · check=${fits} · canvas=${ink}` }));
      };
      if (variant.how === "api") {
        new FontFace(variant.id, variant.src, { display: "block" })
          .load()
          .then((face) => {
            document.fonts.add(face);
            done("loaded");
          })
          .catch((error: unknown) => done(`failed: ${String(error)}`));
      } else {
        void document.fonts
          .load(`20px "${variant.id}"`, variant.codes)
          .then((faces) => done(faces.length ? "loaded" : "no face"))
          .catch((error: unknown) => done(`failed: ${String(error)}`));
      }
    }
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8" dir="rtl">
      <style>
        {VARIANTS.filter((variant) => variant.how === "css")
          .map((variant) => `@font-face { font-family: "${variant.id}"; src: ${variant.src}; font-display: block; }`)
          .join("\n")}
      </style>
      <h1 className="text-xl font-bold">اختبار خطوط المصحف</h1>
      <p className="text-xs text-muted" dir="ltr">
        {agent}
      </p>
      {VARIANTS.map((variant) => (
        <div key={variant.id} className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-bold">{variant.label}</p>
          <p className="mt-2 text-4xl leading-[1.8] text-ink" style={{ fontFamily: `"${variant.id}"` }}>
            {variant.codes}
          </p>
          {/* The same words laid out as the printed page lays them out. */}
          <div
            className="mt-1 flex w-full items-center justify-between"
            style={{ fontFamily: `"${variant.id}"`, fontSize: 30, lineHeight: 1 }}
          >
            {variant.codes.split(" ").map((code, index) => (
              <span key={index} className="whitespace-nowrap">
                {code}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted" dir="ltr">
            {status[variant.id] ?? "loading…"}
          </p>
        </div>
      ))}
      <StageTest when="before" />
      <StageTest when="after" />
    </div>
  );
}
