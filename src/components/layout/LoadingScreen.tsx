"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { siteFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./site-shell.css";

const storageKey = "eslam-platform-loading-shown";
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
 * Shared loading screen (motion-choreography.md): a mark shown once per browser session, capped
 * at ~1.2s, never blocking longer than that.
 */
export function LoadingScreen({ label = "لحظات ونبدأ…" }: LoadingScreenProps) {
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
    <div className={cn("site-loading-screen", siteFontVariables)} role="presentation" aria-hidden="true">
      <div className="site-loading-screen__stage">
        <span className="site-loading-screen__mark" />
        <p className="site-loading-screen__label">{label}</p>
      </div>
    </div>
  );
}
