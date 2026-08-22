/** Dependency-neutral values consumable by Motion. CSS tokens remain the source of timing truth. */
export const socialMotion = {
  sheet: { initial: { opacity: 0, x: "8%" }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: "8%" }, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  dialog: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 4 }, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  onboarding: { initial: { opacity: 0, x: "4%" }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
  toggle: { initial: { opacity: 0.72 }, animate: { opacity: 1 }, transition: { duration: 0.12 } },
  reveal: { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease: [0.2, 0, 0, 1] } },
  reduced: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } },
} as const;

export type SocialMotionKey = keyof typeof socialMotion;

/**
 * GSAP is approved for one branded sequence: the auth brand-panel reveal (`useAuthBrandTimeline`).
 * Any additional sequence needs its own owner/budget sign-off before use; the rest of the
 * interaction surface stays on Framer Motion via `useSocialMotionPreset`.
 */
export const gsapPolicy = {
  approvedSequences: ["auth-brand-reveal"],
  maximumMainThreadMs: 50,
  requiresCleanup: true,
  requiresReducedMotionBranch: true,
} as const;
