"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { Divider } from "./Ornament";

interface PageHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}

export function PageHeader({ kicker, title, description, icon, actions, tone = "dark", className }: PageHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const dark = tone === "dark";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.from("[data-ph]", { autoAlpha: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.09 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <header
      ref={ref}
      // No overflow-hidden here: menus in `actions` (the learner switcher) must hang below the header.
      // z-10 keeps them above the page content that follows; only the decoration is clipped.
      className={cn("relative isolate z-10", dark ? "bg-emerald-deep text-white" : "bg-ivory-deep text-ink", className)}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className={cn("absolute inset-0", dark ? "pattern-stars-light" : "pattern-stars")} />
        {dark && <div className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 md:pb-16 md:pt-16">
        <p
          data-ph
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold",
            dark ? "bg-white/10 text-gold-soft" : "bg-gold-mist text-gold-deep",
          )}
        >
          {icon}
          {kicker}
        </p>
        <h1 data-ph className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description && (
          <p data-ph className={cn("mt-4 max-w-2xl text-base sm:text-lg", dark ? "text-white/75" : "text-muted")}>
            {description}
          </p>
        )}
        {actions && (
          <div data-ph className="mt-6 flex flex-wrap gap-3">
            {actions}
          </div>
        )}
        <div data-ph className="mt-10 max-w-md">
          <Divider tone={dark ? "light" : "gold"} />
        </div>
      </div>
    </header>
  );
}
