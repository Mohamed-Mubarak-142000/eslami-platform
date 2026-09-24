"use client";

import { useEffect, useRef, useState } from "react";
import { useAmbientMotionAllowed } from "@/lib/motion";
import "./twister-shell.css";

interface Particle {
  id: number;
  insetInlineStart: string;
  insetBlockStart: string;
  delaySeconds: number;
  durationSeconds: number;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    insetInlineStart: `${Math.round((index / count) * 92 + Math.random() * 6)}%`,
    insetBlockStart: `${Math.round(10 + Math.random() * 80)}%`,
    delaySeconds: Number((Math.random() * 4).toFixed(2)),
    durationSeconds: Number((7 + Math.random() * 4).toFixed(2)),
  }));
}

export interface AmbientLayerProps {
  particleCount?: number;
}

/**
 * Decorative floating "cheese/gold spark" particles behind hero-style sections. Starts only
 * after mount (never blocks LCP), and stays off entirely for `prefers-reduced-motion` and
 * coarse/touch pointers (motion-choreography.md) — the CSS animation is also reduced-motion
 * guarded as defense in depth.
 */
export function AmbientLayer({ particleCount = 14 }: AmbientLayerProps) {
  const allowed = useAmbientMotionAllowed();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Render already returns null while `!allowed` (below), so there is nothing to clear here —
    // this only needs to schedule spawning particles once ambient motion is actually allowed.
    if (!allowed) return;
    const spawn = () => setParticles(createParticles(particleCount));
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(spawn);
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = setTimeout(spawn, 200);
    return () => clearTimeout(timeout);
  }, [allowed, particleCount]);

  if (!allowed || particles.length === 0) return null;

  return (
    <div className="tw-ambient-layer" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="tw-ambient-layer__particle"
          style={{
            insetInlineStart: particle.insetInlineStart,
            insetBlockStart: particle.insetBlockStart,
            animationDelay: `${particle.delaySeconds}s`,
            animationDuration: `${particle.durationSeconds}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Soft radial glow that follows the pointer; off on touch/coarse pointers and reduced motion. */
export function CursorGlow() {
  const allowed = useAmbientMotionAllowed();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allowed) return;
    function onPointerMove(event: PointerEvent) {
      const node = ref.current;
      if (!node) return;
      node.style.left = `${event.clientX}px`;
      node.style.top = `${event.clientY}px`;
      node.style.opacity = "1";
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [allowed]);

  if (!allowed) return null;

  return <div ref={ref} className="tw-cursor-glow" aria-hidden="true" style={{ opacity: 0 }} />;
}
