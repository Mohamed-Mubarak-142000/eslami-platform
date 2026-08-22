"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Lazy GSAP exception for the decorative auth brand panel only.
 * Consumers mark decorative lines with `data-auth-brand-reveal`. Form controls and content
 * must never be inside the animated scope. Reduced-motion users receive the final static DOM.
 */
export function useAuthBrandTimeline(scope: RefObject<HTMLElement | null>, enabled = true): void {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || prefersReducedMotion || !scope.current) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("gsap").then(({ gsap }) => {
      if (cancelled || !scope.current) return;
      const context = gsap.context(() => {
        gsap.fromTo(
          "[data-auth-brand-reveal]",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all" },
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
