"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellOff, BellRing, X } from "lucide-react";
import { StarMark } from "@/components/ui/Ornament";
import { TOAST_ADHKAR, type ToastDhikr } from "./toastAdhkar";

const INTERVAL_MS = 2 * 60_000;
const VISIBLE_MS = 9_000;
const STORAGE_KEY = "al-manara:adhkar-toast:v1";

// The mushaf reader is excluded so recitation/reading is never interrupted.
const SUPPRESSED = /^\/quran\/\d+/;

const listeners = new Set<() => void>();
function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}
function writeEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: the choice lasts for this page view only.
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdhkarToastEnabled(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
  return [enabled, writeEnabled];
}

export function AdhkarToaster() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useAdhkarToastEnabled();
  const [current, setCurrent] = useState<ToastDhikr | null>(null);
  const indexRef = useRef(-1);
  const hoverRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suppressed = SUPPRESSED.test(pathname);

  useEffect(() => {
    if (!enabled || suppressed) return;
    if (indexRef.current < 0) indexRef.current = Math.floor(Math.random() * TOAST_ADHKAR.length);
    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      indexRef.current = (indexRef.current + 1) % TOAST_ADHKAR.length;
      setCurrent(TOAST_ADHKAR[indexRef.current] ?? null);
    }, INTERVAL_MS);
    return () => clearInterval(tick);
  }, [enabled, suppressed]);

  // Auto-hide after VISIBLE_MS, but keep it open while the pointer or focus is on it.
  useEffect(() => {
    if (!current) return;
    const hideWhenIdle = () => {
      hideTimer.current = setTimeout(() => {
        if (hoverRef.current) hideWhenIdle();
        else setCurrent(null);
      }, VISIBLE_MS);
    };
    hideWhenIdle();
    return () => clearTimeout(hideTimer.current);
  }, [current]);

  const visible = current !== null && enabled && !suppressed;

  return (
    <div aria-live="polite" className="pointer-events-none fixed left-3 top-22 z-50 w-[min(92vw,22rem)] sm:left-6">
      <AnimatePresence>
        {visible && current && (
          <motion.div
            key={current.id}
            role="status"
            initial={{ opacity: 0, x: -40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onMouseEnter={() => (hoverRef.current = true)}
            onMouseLeave={() => (hoverRef.current = false)}
            onFocus={() => (hoverRef.current = true)}
            onBlur={() => (hoverRef.current = false)}
            className="pointer-events-auto relative overflow-hidden rounded-3xl border border-gold/30 bg-emerald-deep p-4 text-white shadow-lift"
          >
            <div className="pattern-stars-light absolute inset-0 opacity-60" aria-hidden />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: VISIBLE_MS / 1000, ease: "linear" }}
              aria-hidden
            />
            <div className="relative flex gap-3">
              <StarMark className="mt-1 size-5 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gold-soft">ذكّر قلبك</p>
                <p className="quran-text mt-1 text-lg leading-9">{current.text}</p>
                <p className="mt-1 text-xs text-white/60">{current.source}</p>
                <button
                  type="button"
                  onClick={() => setEnabled(false)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
                >
                  <BellOff className="size-3.5" aria-hidden /> إيقاف التذكير
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCurrent(null)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdhkarToastToggle() {
  const [enabled, setEnabled] = useAdhkarToastEnabled();
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-emerald/40"
    >
      {enabled ? <BellRing className="size-4 text-emerald" aria-hidden /> : <BellOff className="size-4 text-muted" aria-hidden />}
      {enabled ? "تذكير الأذكار كل ٣٠ ثانية: مفعّل" : "تذكير الأذكار: متوقف"}
    </button>
  );
}
