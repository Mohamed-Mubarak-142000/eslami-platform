"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TAJWEED_LEGEND } from "./tajweedLegend";

/**
 * The tajweed colour key, on the page's own colours so each swatch shows as it does on the page: the
 * dark palette's colours on the night and dusk pages, the light one's otherwise.
 */
export function TajweedSheet({ open, dark, onClose }: { open: boolean; dark: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tajweed-sheet-title"
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-2xl flex-col overflow-clip rounded-t-4xl shadow-lift"
            style={{ background: "var(--page-bg)", color: "var(--page-ink)", paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <div className="shrink-0 px-5 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-current/15" aria-hidden />
              <div className="flex items-center justify-between gap-3">
                <h2 id="tajweed-sheet-title" className="text-lg font-bold" style={{ color: "var(--page-accent)" }}>
                  ألوان التجويد
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="grid size-10 place-items-center rounded-full hover:bg-current/5"
                >
                  <X className="size-5" aria-hidden />
                  <span className="sr-only">إغلاق</span>
                </button>
              </div>
            </div>

            <ul className="flex-1 divide-y divide-current/10 overflow-y-auto overscroll-contain px-5 pb-6 pt-2">
              {TAJWEED_LEGEND.map((entry) => (
                <li key={entry.name} className="flex items-start gap-3 py-3">
                  <span
                    className="mt-1 size-5 shrink-0 rounded-full ring-1 ring-current/10"
                    style={{ background: dark ? entry.dark : entry.light }}
                    aria-hidden
                  />
                  <span>
                    <span className="block font-bold">{entry.name}</span>
                    <span className="mt-0.5 block text-sm leading-6 opacity-75">{entry.explanation}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
