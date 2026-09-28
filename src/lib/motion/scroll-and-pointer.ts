"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useSyncExternalStore, type RefObject } from "react";

/**
 * Scroll-reveal and pointer/motion-preference helpers, added alongside the existing
 * `MotionFoundation`/`useAuthBrandTimeline` exports (docs/ux/motion-choreography.md). Motion here
 * is always a progressive enhancement: nothing in these hooks blocks content from rendering.
 */

function getCoarsePointerSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function subscribeToCoarsePointer(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener?.("change", onStoreChange);
  return () => query.removeEventListener?.("change", onStoreChange);
}

/** SSR-safe `(pointer: coarse)` — server snapshot is always `false`, settling right after hydration. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeToCoarsePointer, getCoarsePointerSnapshot, () => false);
}

/**
 * `AmbientLayer`/`CursorGlow` are decorative only and must stay off for reduced-motion users and
 * touch/coarse-pointer devices (no real cursor, and motion-choreography.md disables them there).
 */
export function useAmbientMotionAllowed(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  return !prefersReducedMotion && !coarsePointer;
}

/**
 * One-time scroll-triggered reveal (`opacity+y`, ~0.4s, `power2.out`, plays once) for homepage
 * sections, per motion-choreography.md's ScrollTrigger rules. Lazy-loads GSAP + ScrollTrigger so
 * neither ships in the initial bundle; a `prefers-reduced-motion` user gets the final static DOM.
 */
export function useSectionReveal(scope: RefObject<HTMLElement | null>, enabled = true): void {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || prefersReducedMotion || !scope.current) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !scope.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(
          scope.current,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: { trigger: scope.current, start: "top 80%", toggleActions: "play none none none" },
          },
        );
      }, scope.current);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled, prefersReducedMotion, scope]);
}
