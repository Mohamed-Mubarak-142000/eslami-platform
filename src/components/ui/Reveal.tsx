"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** CSS selector of children to stagger; when omitted the wrapper itself fades up. */
  stagger?: string;
  delay?: number;
  as?: "div" | "section" | "ul";
}

/** Scroll-triggered fade-up (GSAP). Content is fully visible without JS or with reduced motion. */
export function Reveal({ children, className, stagger, delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const targets = stagger ? gsap.utils.toArray<HTMLElement>(stagger, ref.current) : [ref.current];
        gsap.from(targets, {
          autoAlpha: 0,
          y: 28,
          duration: 0.8,
          delay,
          ease: "power3.out",
          stagger: Math.min(0.08, 0.9 / Math.max(1, targets.length)),
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className)}>
      {children}
    </Tag>
  );
}
