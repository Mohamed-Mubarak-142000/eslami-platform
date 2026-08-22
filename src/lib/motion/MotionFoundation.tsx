"use client";

import { MotionConfig, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { socialMotion, type SocialMotionKey } from "@/styles/motion";

/** Keeps reduced-motion policy at a narrow client boundary. */
export function MotionFoundation({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Resolve an accepted preset without making animation necessary for rendering. */
export function useSocialMotionPreset(key: Exclude<SocialMotionKey, "reduced">) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? socialMotion.reduced : socialMotion[key];
}
