"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import "./twister-shell.css";

/** Thin fixed progress bar reflecting page scroll — purely decorative, never blocks content. */
export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, { stiffness: 220, damping: 30, restDelta: 0.001 });

  if (prefersReducedMotion) return null;

  return (
    <div className="tw-scroll-progress" aria-hidden="true">
      <motion.div className="tw-scroll-progress__bar" style={{ scaleX: smoothed }} />
    </div>
  );
}
