"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { pickLine, type CompanionLineKind } from "./companionLines";
import type { CompanionMood } from "./Companion";

interface Reaction {
  line: string | null;
  mood: CompanionMood;
}

interface CompanionContextValue extends Reaction {
  /** Makes the companion say something for a few seconds, then go back to idle. */
  react: (kind: CompanionLineKind, mood?: CompanionMood) => void;
  /** Sets a lasting mood (e.g. "thinking" while listening) without a line; pass "idle" to clear. */
  setMood: (mood: CompanionMood) => void;
}

const MOOD_FOR: Partial<Record<CompanionLineKind, CompanionMood>> = {
  correct: "happy",
  finish: "cheer",
  daily: "cheer",
  chest: "cheer",
  almost: "thinking",
  listening: "thinking",
};

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [reaction, setReaction] = useState<Reaction>({ line: null, mood: "idle" });
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const react = useCallback((kind: CompanionLineKind, mood?: CompanionMood) => {
    counter.current += 1;
    setReaction({ line: pickLine(kind, counter.current + Date.now() / 1000), mood: mood ?? MOOD_FOR[kind] ?? "happy" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction({ line: null, mood: "idle" }), 3200);
  }, []);

  const setMood = useCallback((mood: CompanionMood) => {
    if (timer.current) clearTimeout(timer.current);
    setReaction({ line: null, mood });
  }, []);

  const value = useMemo(() => ({ ...reaction, react, setMood }), [reaction, react, setMood]);
  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}

const NOOP: CompanionContextValue = { line: null, mood: "idle", react: () => {}, setMood: () => {} };

/** Safe outside the kids area too: without a provider the reactions do nothing. */
export function useCompanion(): CompanionContextValue {
  return useContext(CompanionContext) ?? NOOP;
}
