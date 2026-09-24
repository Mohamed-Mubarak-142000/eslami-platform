"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { twisterFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./twister-shell.css";

const storageKey = "twister-loading-shown";
const displayMs = 1100;
const noopSubscribe = () => () => {};

function readNotShownYet(): boolean {
  try {
    return sessionStorage.getItem(storageKey) !== "1";
  } catch {
    return true;
  }
}

export interface LoadingScreenProps {
  label?: string;
}

/**
 * Twister loading screen (motion-choreography.md): a spinning-pizza mark shown once per browser
 * session, capped at ~1.2s, never blocking longer than that. Superseding role of the legacy
 * `SplashScreen` for new Twister routes — `SplashScreen` itself stays untouched for the existing
 * Al-Manara root layout so nothing there breaks before the reverse sweep.
 */
export function LoadingScreen({ label = "بنجهزلك المنيو…" }: LoadingScreenProps) {
  /** Resolves to the real session-storage read only after hydration, avoiding an SSR mismatch. */
  const notShownYet = useSyncExternalStore(noopSubscribe, readNotShownYet, () => false);
  const [dismissed, setDismissed] = useState(false);
  const visible = notShownYet && !dismissed;

  useEffect(() => {
    if (!notShownYet) return;
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Private browsing or blocked storage: show it once per mount without persisting.
    }
  }, [notShownYet]);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setDismissed(true), displayMs);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={cn("tw-loading-screen", twisterFontVariables)} role="presentation" aria-hidden="true">
      <div className="tw-loading-screen__stage">
        <span className="tw-loading-screen__pizza" />
        <p className="tw-loading-screen__label">{label}</p>
      </div>
    </div>
  );
}
