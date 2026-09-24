"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { twisterFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import "./twister-shell.css";

export interface PageTransitionProps {
  children: ReactNode;
  /** Usually the pathname — changing it re-triggers the enter animation for the new page. */
  transitionKey: string;
}

/**
 * Wraps routed page content with a short, non-blocking fade+rise on navigation. Content is
 * always present in the DOM in its final state; this only animates the transition, never gates
 * first paint (motion-choreography.md's "LCP لا يُحجب" rule applies here too).
 */
export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn("tw-page-transition", twisterFontVariables)}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        className={cn("tw-page-transition", twisterFontVariables)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
