"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { MushafGlyphPage } from "@/features/quran/MushafGlyphPage";
import type { MushafPageData } from "@/features/quran/mushafPageTypes";

/*
 * Temporary diagnostic: the printed page draws on iPhone in isolation but not in the reader. Each
 * row below puts the words through one thing the reader does, to find which one blanks them.
 */

const CODES = "ﭑ ﭒ ﭓ ﭔ ﭕ".split(" ");

function useFont(page: number): string | null {
  const [family, setFamily] = useState<string | null>(null);
  useEffect(() => {
    const name = `ft-part-p${page}`;
    void new FontFace(name, `url("https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${page}.woff2") format("woff2")`, {
      display: "block",
    })
      .load()
      .then((face) => {
        document.fonts.add(face);
        setFamily(name);
      });
  }, [page]);
  return family;
}

function Words({ family }: { family: string }) {
  return (
    <div className="flex w-full items-center justify-between" style={{ fontFamily: family, fontSize: 30, lineHeight: 1 }}>
      {CODES.map((code, index) => (
        <span key={index} className="whitespace-nowrap">
          {code}
        </span>
      ))}
    </div>
  );
}

function Row({ label, children, note }: { label: string; children: ReactNode; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 min-h-12">{children}</div>
      <p className="mt-2 text-xs text-muted" dir="ltr">
        {note}
      </p>
    </div>
  );
}

/** ي: inside a framer-motion draggable, as the reader's swipe-to-turn stage. */
export function DragRow() {
  const family = useFont(3);
  return (
    <Row label="ي: داخل طبقة السحب (framer-motion drag)" note={family ? "font loaded" : "loading…"}>
      <motion.div drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0} dragMomentum={false}>
        {family && <Words family={family} />}
      </motion.div>
    </Row>
  );
}

/** ك: through the reader's GSAP page-turn (autoAlpha + rotateY in perspective, then clearProps). */
export function TurnRow() {
  const family = useFont(4);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!family || !ref.current) return;
    gsap.fromTo(
      ref.current,
      { autoAlpha: 0, x: -48, rotateY: 9, transformOrigin: "right center" },
      { autoAlpha: 1, x: 0, rotateY: 0, duration: 0.6, ease: "power3.out", clearProps: "transform" },
    );
  }, [family]);
  return (
    <Row label="ك: مع أنيميشن تقليب الصفحة (GSAP)" note={family ? "font loaded" : "loading…"}>
      <div style={{ perspective: 1600 }}>
        <div ref={ref}>{family && <Words family={family} />}</div>
      </div>
    </Row>
  );
}

/** ل: hidden with visibility until laid out, as the printed page does. */
export function HiddenRow() {
  const family = useFont(5);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!family) return;
    const timer = window.setTimeout(() => setShown(true), 300);
    return () => window.clearTimeout(timer);
  }, [family]);
  return (
    <Row label="ل: مخفية ثم تظهر (visibility)" note={family ? `font loaded · shown=${shown}` : "loading…"}>
      <div className={shown ? "" : "invisible"}>{family && <Words family={family} />}</div>
    </Row>
  );
}

/** م: the reader's own printed-page component, alone, for page 3. */
export function RealPageRow() {
  const [data, setData] = useState<MushafPageData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void fetch("/api/mushaf/3")
      .then((response) => response.json() as Promise<MushafPageData>)
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  const lines = data?.glyphs?.v1 ?? null;
  return (
    <Row label="م: صفحة المصحف الحقيقية لوحدها (صفحة ٣)" note={failed ? "font failed" : lines ? `${lines.length} lines` : "loading…"}>
      <div style={{ color: "#1b2a24" }}>
        {lines && (
          <MushafGlyphPage
            page={3}
            lines={lines}
            edition="v1"
            palette="light"
            ink="#1b2a24"
            selectedAyah={null}
            playingAyah={null}
            onSelect={() => {}}
            onFail={() => setFailed(true)}
          />
        )}
      </div>
    </Row>
  );
}

/** ن: the whole reader in a frame, page 4. */
export function ReaderFrameRow() {
  return (
    <Row label="ن: القارئ كامل داخل إطار (صفحة ٤)" note="iframe /quran/2?page=4">
      <iframe title="القارئ" src="/quran/2?page=4" className="h-[36rem] w-full rounded-xl border border-line" />
    </Row>
  );
}
