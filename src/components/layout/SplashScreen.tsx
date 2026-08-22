"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BrandLogo } from "./BrandLogo";
import "./splash-screen.css";

const storageKey = "manara-splash-shown";
const displayMs = 1100;
const noopSubscribe = () => () => {};

function readNotShownYet(): boolean {
  try {
    return sessionStorage.getItem(storageKey) !== "1";
  } catch {
    return true;
  }
}

export function SplashScreen() {
  const prefersReducedMotion = useReducedMotion();
  /** Resolves to the real session-storage read only after hydration, avoiding an SSR mismatch. */
  const notShownYet = useSyncExternalStore(noopSubscribe, readNotShownYet, () => false);
  const [dismissed, setDismissed] = useState(false);
  const visible = notShownYet && !prefersReducedMotion && !dismissed;

  useEffect(() => {
    if (!notShownYet) return;
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Private browsing or blocked storage: show the splash without persisting.
    }
  }, [notShownYet]);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setDismissed(true), displayMs);
    return () => clearTimeout(timeout);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDismissed(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-screen"
          role="presentation"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          onClick={() => setDismissed(true)}
        >
          <motion.div
            className="splash-screen__mark"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          >
            <BrandLogo priority />
            <p className="splash-screen__tagline">معرفة إسلامية موثوقة</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
